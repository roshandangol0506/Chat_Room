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

type RoomType = {
  _id: string;
  roomName: string;
  admin: string | { _id: string; name: string; email: string };
  users: string[];
};

export default function Chat() {
  const [room, setRoom] = useState<string>("");
  const [roomAdmin, setRoomAdmin] = useState<string>("");
  const [roomMembers, setRoomMembers] = useState<MemberType[]>([]);
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
    roomMember,
    rooms,
    sendMessage,
    joinRoom,
    setActive,
    inviteUser,
    createRoom,
    getRoomMembers,
    removeRoomMembers,
    isConnected,
  } = useWebSocket(room, loginUser?.id || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleRoomChange = async (
    roomId: string,
    roomAdmin: string | { _id: string; name: string; email: string } | "",
    roomUserIds: string[]
  ) => {
    setRoom(roomId);

    // Extract admin ID correctly whether it's a string or object, with safety checks
    const adminId = roomAdmin
      ? typeof roomAdmin === "string"
        ? roomAdmin
        : roomAdmin._id || ""
      : "";
    setRoomAdmin(adminId);

    getRoomMembers(roomId);
    joinRoom(roomId, loginUser?.id || "");

    try {
      // Map user IDs to user objects
      const memberDetails = roomUserIds
        .map((userId) => users.find((user) => user._id === userId))
        .filter(Boolean) as MemberType[];

      console.log("Setting room members:", memberDetails);
      setRoomMembers(memberDetails);
    } catch (error) {
      console.error("Error mapping room members:", error);
    }
  };

  const handleRoomDelete = async (
    room_id: string,
    room_admin: string | { _id: string; name: string; email: string } | ""
  ) => {
    try {
      // Extract admin ID correctly whether it's a string or object, with safety checks
      const adminId = room_admin
        ? typeof room_admin === "string"
          ? room_admin
          : room_admin._id || ""
        : "";

      if (adminId === loginUser?.id) {
        const confirmDelete = window.confirm(
          "Are you sure you want to delete this room?"
        );
        if (!confirmDelete) return;
        toast.success("Room deleted successfully");
        const response = await axios.delete(
          `http://localhost:8000/deleteroom/${room_id}`
        );
        setSuccess("Room deleted successfully");
        // No need to call fetchRoom as the WebSocket will update the rooms
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

  const handleCreateRoom = async () => {
    if (!roomName || usertoCreateRoom.length === 0) {
      setError("All fields are required");
      return;
    }
    if (loginUser?.id && roomName && usertoCreateRoom.length != 0) {
      createRoom(loginUser.id, roomName, usertoCreateRoom);
      setroomName("");
      setusertoCreateRoom([]);
      setCreateRoomOpen(false);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && loginUser?.id) {
      sendMessage(message, loginUser.id);
      setMessage("");
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchLoginUser();
      await fetchUser();
      setIsLoading(false);
    };

    loadInitialData();
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

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:8000/user");
      setUsers(response.data.data);
      setError(null);
    } catch (error) {
      setError(`Failed to fetch Users: ${error}`);
    }
  };

  const fetchLoginUser = async () => {
    try {
      const response = await fetch("http://localhost:8000/checkAuth", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.isAuthenticated) {
        setLoginUser({
          id: data.userId,
          username: data.username,
          email: data.email,
        });
      }
    } catch (error) {
      console.error("Error fetching login user:", error);
    }
  };

  // Find current room name
  const currentRoomName = rooms.find((r) => r._id === room)?.roomName || "Chat";

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading chat...
          </p>
        </div>
      </div>
    );
  }

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
            setRoomMembers={setRoomMembers}
            roomMember={roomMember}
            getRoomMembers={getRoomMembers}
            removeRoomMembers={removeRoomMembers}
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
