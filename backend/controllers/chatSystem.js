const Message = require("../modules/chatMessage");
const Room = require("../modules/chatRoom");
const redis = require("./redis");
const redisClient = require("../redisConnection/redisClient");

const rooms = {};

async function handleDeleteRoom(req, res) {
  try {
    const { room_id } = req.params;
    const deleteRoom = await Room.findByIdAndDelete(room_id);
    if (!deleteRoom) {
      return res.status(404).json({ error: "Cannot Find Room" });
    }
    return res.status(200).json({ message: "Room Deleted Successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to Delete Room" });
  }
}

async function handleGetRoom(req, res) {
  try {
    const data = await Room.find({}).populate("users");
    res.status(200).json({ data });
  } catch {
    res.status(500).json({ message: "Failed to get rooms" });
  }
}

async function handleGetRooms(ws, userId) {
  try {
    const rooms = await Room.find({
      $or: [{ users: userId }, { admin: { $exists: true, $eq: userId } }],
    })
      .populate("users")
      .populate("admin", "name email");
    ws.send(
      JSON.stringify({
        type: "roomList",
        rooms,
      })
    );
  } catch (error) {
    console.error("Error getting rooms:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to get rooms",
      })
    );
  }
}

async function handleJoinRoom(ws, room, selectedUser) {
  try {
    const roomData = await Room.findOne({ _id: room, users: selectedUser });

    if (!roomData) {
      ws.send(
        JSON.stringify({
          type: "userUnavailable",
          message: "You are unauthorized to join this room",
        })
      );
      return;
    }

    if (!rooms[room]) {
      rooms[room] = [];
    }

    const redisKey = `chat:${room}`;
    let messages = [];

    try {
      // Use consistent Redis data type (lists)
      const cachedMessages = await redisClient.lrange(redisKey, 0, -1);

      if (cachedMessages && cachedMessages.length > 0) {
        messages = cachedMessages.map((msg) => JSON.parse(msg));
        console.log("Loaded messages from Redis");
      } else {
        // Not in Redis: fetch from MongoDB
        const mongoMessages = await Message.find({ roomName: room })
          .populate("user", "name")
          .sort({ createdAt: -1 })
          .limit(50);

        messages = mongoMessages.map((msg) => ({
          message: msg.message,
          user: { name: msg.user.name },
          timestamp: msg.createdAt
            ? new Date(msg.createdAt).getTime()
            : Date.now(),
        }));

        console.log("Loaded messages from MongoDB");

        // Store in Redis as a LIST (not a sorted set)
        if (messages.length > 0) {
          const pipeline = redisClient.multi();

          // Clear any existing data for this key first
          pipeline.del(redisKey);

          // Add messages to the list
          for (const msg of messages) {
            pipeline.rpush(redisKey, JSON.stringify(msg));
          }

          // Set expiry for 10 minutes
          pipeline.expire(redisKey, 600);
          await pipeline.exec();

          console.log("Cached messages in Redis for 10 minutes");
        }
      }
    } catch (redisError) {
      console.error("Redis error, falling back to MongoDB:", redisError);

      // If there's an error with Redis, clear the key and fall back to MongoDB
      await redisClient.del(redisKey);

      const mongoMessages = await Message.find({ roomName: room })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(50);

      messages = mongoMessages.map((msg) => ({
        message: msg.message,
        user: { name: msg.user.name },
        timestamp: msg.createdAt
          ? new Date(msg.createdAt).getTime()
          : Date.now(),
      }));
    }

    // Send messages to the user
    ws.send(JSON.stringify({ type: "previousMessages", messages }));

    rooms[room].push(ws);
    console.log(`User ${selectedUser} joined room: ${room}`);
  } catch (error) {
    console.error("Error in handleJoinRoom:", error);
    ws.send(
      JSON.stringify({ type: "error", message: `Catch error: ${error}` })
    );
  }
}

async function handleSendMessage(room, message, user) {
  if (rooms[room]) {
    // Format the message to include the user's name
    const formattedMessage = `${user.name}: ${message}`;

    // Broadcast message to all connected clients in the room
    rooms[room].forEach((client) => {
      client.send(
        JSON.stringify({
          type: "message",
          message: formattedMessage,
        })
      );
    });

    try {
      const updateRoom = await Room.findById(room);
      if (updateRoom.users.includes(user._id)) {
        // 1️⃣ Save message to MongoDB
        const newMessage = new Message({
          user: user._id,
          roomName: room,
          message: message,
        });
        await newMessage.save();
        console.log("Message saved to MongoDB");

        // 2️⃣ Save message to Redis (as list item)
        const redisKey = `chat:${room}`;
        const messageObject = {
          message: message,
          user: { name: user.name },
          timestamp: Date.now(),
        };

        // Use rpush for consistent use of Redis lists
        await redisClient.rpush(redisKey, JSON.stringify(messageObject));
        await redisClient.expire(redisKey, 600); // expire after 10 minutes
        console.log("Message saved to Redis");
      } else {
        console.log("User not authorized to send message in this room");
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }
}

async function handleInviteUser(
  ws,
  room,
  invitedby,
  inviteMessage,
  invitedto,
  operationId
) {
  if (rooms[room]) {
    try {
      const updateRoom = await Room.findById(room);
      if (!updateRoom) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Room not found",
            operationId,
          })
        );
        return;
      }

      if (
        updateRoom.users.includes(invitedby) &&
        !updateRoom.users.includes(invitedto)
      ) {
        updateRoom.users.push(invitedto);
        await updateRoom.save();
        console.log("User invited and added to the room.");

        // Send success message to the client who initiated the invite
        ws.send(
          JSON.stringify({
            type: "success",
            message: "User is added to the room",
            operationId,
            userId: invitedto,
            roomId: room,
          })
        );

        // Notify all clients in the room about the new member
        rooms[room].forEach((client) => {
          client.send(
            JSON.stringify({
              type: "memberAdded",
              message: "New member added to the room",
              userId: invitedto,
              roomId: room,
            })
          );
        });
      } else {
        console.log(
          "User is already in the room or invited friend is not in the room."
        );
        ws.send(
          JSON.stringify({
            type: "error",
            message: "User is already in the room or not authorized",
            operationId,
          })
        );
      }
    } catch (err) {
      console.error("Failed to invite user:", err);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to invite user",
          operationId,
        })
      );
    }
  }
}

async function handleCreateRoomWs(ws, admin, roomName, users) {
  try {
    if (!admin) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid Admin" }));
      return;
    }
    if (!roomName) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid Room Name" }));
      return;
    }
    if (!Array.isArray(users)) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid Users" }));
      return;
    }

    if (!users.includes(admin)) {
      users.push(admin);
    }

    console.log("admin while creating room is ", admin);

    const newRoom = new Room({ admin, roomName, users });

    await newRoom.save();
    ws.send(
      JSON.stringify({
        type: "success",
        message: "Room Created Successfully",
        newRoom,
      })
    );
  } catch (error) {
    console.error("Error creating room:", error);
    ws.send(
      JSON.stringify({ type: "error", message: "Failed to create Room" })
    );
  }
}

async function handleGetRoomMembers(ws, roomId) {
  try {
    const room = await Room.findById(roomId).populate(
      "users",
      "name username email _id"
    );

    if (!room) {
      ws.send(
        JSON.stringify({
          type: "roomMembers",
          error: "Room not found",
        })
      );
      return;
    }

    ws.send(
      JSON.stringify({
        type: "roomMembers",
        members: room.users,
      })
    );
  } catch (error) {
    console.error("Error fetching room members:", error);
    ws.send(
      JSON.stringify({
        type: "roomMembers",
        error: "Failed to get room members",
      })
    );
  }
}

async function handleRemoveRoomMembers(ws, roomId, userId, operationId) {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { $pull: { users: userId } },
      { new: true }
    );

    if (!updatedRoom) {
      ws.send(
        JSON.stringify({
          type: "removeMembers",
          error: "Room not found",
          operationId,
        })
      );
      return;
    }

    ws.send(
      JSON.stringify({
        type: "removeMembers",
        message: "Successfully Removed Member",
        userId: userId,
        roomId: roomId,
        operationId,
      })
    );

    // Notify all clients in the room about the member removal
    if (rooms[roomId]) {
      rooms[roomId].forEach((client) => {
        client.send(
          JSON.stringify({
            type: "removeMembers",
            message: "A member was removed from the room",
            userId: userId,
            roomId: roomId,
          })
        );
      });
    }
  } catch (error) {
    console.error("Error Removing room members:", error);
    ws.send(
      JSON.stringify({
        type: "removeMembers",
        error: "Failed to Remove room members",
        operationId,
      })
    );
  }
}

module.exports = {
  handleInviteUser,
  handleJoinRoom,
  handleSendMessage,
  handleGetRoom,
  handleGetRooms,
  handleDeleteRoom,
  handleCreateRoomWs,
  handleGetRoomMembers,
  handleRemoveRoomMembers,
};
