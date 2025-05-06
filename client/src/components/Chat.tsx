"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import useWebSocket from "@/WebSocket/useWebSocket";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import { toast } from "sonner";

type MemberType = {
  _id: string;
  name: string;
  username: string;
  email: string;
};

export default function Chat() {
  const [room, setRoom] = useState<string>("");
  const [roomAdmin, setRoomAdmin] = useState<string>("");
  const [roomMembers, setRoomMembers] = useState<MemberType[]>([]);
  const [rooms, setRooms] = useState<
    { _id: string; roomName: string; admin: string; users: string[] }[]
  >([]);
  const [users, setUsers] = useState<
    {
      _id: string;
      name: string;
      username: string;
      email: string;
    }[]
  >([]);
  const [usertoCreateRoom, setusertoCreateRoom] = useState<string[]>([]);
  const [inviteUserid, setinviteUserid] = useState<string>("");
  const [roomName, setroomName] = useState("");
  const [loginUser, setLoginUser] = useState<{
    id: string;
    username: string;
    email: string;
  } | null>(null);
  const {
    messages,
    active,
    sendMessage,
    joinRoom,
    setActive,
    inviteUser,
    createRoom,
  } = useWebSocket(room, loginUser?.id || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  const handleRoomChange = async (
    roomId: string,
    roomAdmin: string,
    roomUserIds: string[]
  ) => {
    setRoom(roomId);
    setRoomAdmin(roomAdmin);
    joinRoom(roomId, loginUser?.id || "");

    try {
      // Map user IDs to user objects
      const memberDetails = roomUserIds
        .map((userId) => users.find((user) => user._id === userId))
        .filter(Boolean) as MemberType[];

      console.log("Setting room members:", memberDetails);
      setRoomMembers(roomUserIds as MemberType[]);
    } catch (error) {
      console.error("Error mapping room members:", error);
    }
  };

  const handleRoomDelete = async (room_id: string, room_admin: string) => {
    try {
      if (room_admin === loginUser?.id) {
        const confirmDelete = window.confirm(
          "Are you sure you want to delete this room?"
        );
        if (!confirmDelete) return;
        toast.success("Room deleted successfully");
        const response = await axios.delete(
          `http://localhost:8000/deleteroom/${room_id}`
        );
        setSuccess("Room deleted successfully");
        fetchRoom();
      } else {
        toast("You are not authorized to delete this room");
      }
    } catch {
      setError("Failed to delete room");
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    setusertoCreateRoom((prevSelected) =>
      checked
        ? [...prevSelected, userId]
        : prevSelected.filter((id) => id !== userId)
    );
  };

  const fetchRoom = async () => {
    try {
      const response = await axios.get("http://localhost:8000/getroom");
      setRooms(response.data.data);

      // If we have a current room selected, update its members
      if (room) {
        const currentRoom = response.data.data.find((r: any) => r._id === room);
        if (currentRoom) {
          const memberDetails = currentRoom.users
            .map((userId: string) => users.find((user) => user._id === userId))
            .filter(Boolean) as MemberType[];

          setRoomMembers(memberDetails);
        }
      }

      setError(null);
    } catch (error) {
      setError(`Failed to fetch rooms: ${error}`);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:8000/user");
      setUsers(response.data.data);
      setError(null);

      // If we already have a room selected, update its members with the new user data
      if (room) {
        const currentRoom = rooms.find((r) => r._id === room);
        if (currentRoom) {
          const memberDetails = currentRoom.users
            .map((userId) =>
              response.data.data.find((user: any) => user._id === userId)
            )
            .filter(Boolean) as MemberType[];

          setRoomMembers(memberDetails);
        }
      }
    } catch (error) {
      setError(`Failed to fetch Users: ${error}`);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName || usertoCreateRoom.length === 0) {
      setError("All fields are required");
      return;
    }
    if (loginUser?.id && roomName && usertoCreateRoom.length != 0) {
      createRoom(loginUser.id, roomName, usertoCreateRoom);
      setroomName("");
      setusertoCreateRoom([]);
      fetchRoom();
      setCreateRoomOpen(false);
    }
  };

  const handleRemoveMember = async (roomId: string, userId: string) => {
    try {
      await axios.post(
        "http://localhost:8000/removemember",
        { room_id: roomId, user_id: userId },
        { withCredentials: true }
      );

      // Update local state immediately
      setRoomMembers((prev) => prev.filter((member) => member._id !== userId));

      // Refresh rooms data
      fetchRoom();
    } catch (error: any) {
      console.error(
        `Failed to delete room members: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && loginUser?.id) {
      sendMessage(message, loginUser.id);
      setMessage("");
    }
  };

  useEffect(() => {
    fetchRoom();
    fetchUser();
    fetchLoginUser();
  }, []);

  useEffect(() => {
    if (loginUser?.id) {
      // Add current user to active list immediately
      setActive((prev) => {
        if (prev.includes(loginUser.id)) return prev;
        return [...prev, loginUser.id];
      });
    }
  }, [loginUser, setActive]);

  const fetchLoginUser = async () => {
    fetch("http://localhost:8000/checkAuth", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isAuthenticated) {
          setLoginUser({
            id: data.userId,
            username: data.username,
            email: data.email,
          });
        }
      });
  };

  // Find current room name
  const currentRoomName = rooms.find((r) => r._id === room)?.roomName || "Chat";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Fixed sidebar */}
      <div className="w-64 flex-shrink-0 fixed top-0 bottom-0 left-0 z-10 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <Sidebar
          rooms={rooms}
          users={users}
          loginUser={loginUser}
          handleRoomChange={handleRoomChange}
          createRoomOpen={createRoomOpen}
          setCreateRoomOpen={setCreateRoomOpen}
          roomName={roomName}
          setroomName={setroomName}
          usertoCreateRoom={usertoCreateRoom}
          handleUserSelection={handleUserSelection}
          handleCreateRoom={handleCreateRoom}
          error={error}
          setError={setError}
          success={success}
          fetchLoginUser={fetchLoginUser}
          handleRoomDelete={handleRoomDelete}
          active={active}
        />
      </div>

      {/* Main content area with fixed navbar */}
      <div className="pl-64 flex-1 flex flex-col h-screen">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-950">
          <Navbar
            currentRoomName={currentRoomName}
            room={room}
            roomAdmin={roomAdmin}
            roomMembers={roomMembers}
            rooms={rooms}
            users={users}
            inviteUserid={inviteUserid}
            setinviteUserid={setinviteUserid}
            loginUser={loginUser}
            inviteUser={inviteUser}
            fetchRoom={fetchRoom}
            handleRemoveMember={handleRemoveMember}
            setRoomMembers={setRoomMembers}
          />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <MessageList messages={messages} loginUser={loginUser} />

          <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-950">
            <MessageInput
              message={message}
              setMessage={setMessage}
              handleSendMessage={handleSendMessage}
              loginUser={loginUser}
              room={room}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
