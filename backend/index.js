const express = require("express");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const { parse } = require("cookie");
const { promisify } = require("util");
require("dotenv").config();

const { connectTomongoDB } = require("./connect");
const {
  handleJoinRoom,
  handleSendMessage,
  handleInviteUser,
  handleGetRoomMembers,
  handleRemoveRoomMembers,
  handleCreateRoomWs,
  handleGetRooms,
} = require("./controllers/chatSystem");
const { getUser } = require("./service/auth");

const adminRouter = require("./routes/admin");
const userRouter = require("./routes/user");
const roleRouter = require("./routes/role");
const permissionRouter = require("./routes/permission");
const role_userRouter = require("./routes/role_user");
const permission_roleRouter = require("./routes/permission_role");
const middlewareRouter = require("./routes/auth");
const categoryRouter = require("./routes/category");
const redisRouter = require("./routes/redis");
const chatRouter = require("./routes/chatSystem");

const app = express();
const server = http.createServer(app); // Use the same server for Express & WebSockets

const wss = new WebSocket.Server({ server }); // Attach WebSockets to the same server

// Convert session middleware into a function WebSockets can use
const sessionParser = promisify(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/clickpoint",
    }),
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

const activeUsers = {}; // Store active users

wss.on("connection", async (ws, req) => {
  try {
    const cookies = parse(req.headers.cookie || "");
    const sessionId = cookies["uid"];

    if (!sessionId) {
      ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
      ws.close();
      return;
    }

    const user = getUser(sessionId);
    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "Session expired" }));
      ws.close();
      return;
    }

    ws.user = user;
    console.log(`User ${user.email} connected`);

    // Mark this user as active
    activeUsers[user.email] = true;

    // Send the full active users list to THIS user
    const activeUserIds = [];
    for (const client of wss.clients) {
      if (
        client.readyState === WebSocket.OPEN &&
        client.user &&
        activeUsers[client.user.email]
      ) {
        activeUserIds.push(client.user._id); // consistent _id
      }
    }

    ws.send(
      JSON.stringify({
        type: "activeUsers",
        users: activeUserIds,
      })
    );

    // Notify everyone else that this user is now active
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "userActive",
            user: user._id,
          })
        );
      }
    });

    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());
      console.log(`Received from ${user.email}: ${message}`);

      switch (data.type) {
        case "requestActiveUsers":
          const activeUserIds = [];
          for (const client of wss.clients) {
            if (
              client.readyState === WebSocket.OPEN &&
              client.user &&
              activeUsers[client.user.email]
            ) {
              activeUserIds.push(client.user._id);
            }
          }

          ws.send(
            JSON.stringify({
              type: "activeUsers",
              users: activeUserIds,
            })
          );
          break;
        case "joinRoom":
          handleJoinRoom(ws, data.Room, data.selecteduser);
          break;
        case "sendMessage":
          handleSendMessage(data.room, data.message, user);
          break;
        case "inviteUser":
          handleInviteUser(
            ws,
            data.room,
            data.invitedby,
            data.inviteMessage,
            data.invitedto,
            data.operationId
          );
          break;
        case "createRoom":
          handleCreateRoomWs(ws, data.admin, data.room, data.users);
          break;
        case "getRoomMembers":
          handleGetRoomMembers(ws, data.room);
          break;
        case "removeRoomMembers":
          handleRemoveRoomMembers(ws, data.room, data.userId, data.operationId);
          break;
        case "getRooms":
          handleGetRooms(ws, data.selecteduser);
          break;
        default:
          console.log("Unknown event type:", data.type);
      }
    });

    ws.on("close", () => {
      console.log(`User ${user.email} disconnected`);
      delete activeUsers[user.email];

      // Notify all clients about this user being inactive
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "userInactive",
              user: user._id,
            })
          );
        }
      });
    });
  } catch (err) {
    console.error("WebSocket error:", err);
    ws.close();
  }
});

connectTomongoDB(process.env.mongodb_connection)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const corsOptions = {
  origin: ["http://localhost:3000"],
  methods: "GET, POST, PUT, DELETE, OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", adminRouter);
app.use("/", userRouter);
app.use("/", roleRouter);
app.use("/", permissionRouter);
app.use("/", role_userRouter);
app.use("/", permission_roleRouter);
app.use("/", middlewareRouter);
app.use("/", categoryRouter);
app.use("/", redisRouter);
app.use("/", chatRouter);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
