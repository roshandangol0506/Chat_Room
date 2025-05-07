"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

type RoomType = {
  _id: string;
  roomName: string;
  admin: string | { _id: string; name: string; email: string };
  users: string[];
};

const useWebSocket = (room: string, selecteduser: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [active, setActive] = useState<string[]>([]);
  const [roomMember, setRoomMember] = useState<any[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [pendingOperations, setPendingOperations] = useState<
    Map<string, () => void>
  >(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000");
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      // Request active users immediately on connection
      if (selecteduser) {
        ws.send(JSON.stringify({ type: "requestActiveUsers" }));
        ws.send(JSON.stringify({ type: "getRooms", selecteduser }));
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data.type);

        switch (data.type) {
          case "message":
            setMessages((prev) => [...prev, data.message]);
            break;
          case "previousMessages":
            const previousMessages = data.messages.map(
              (msg: any) => `${msg.user.name}: ${msg.message}`
            );
            setMessages(previousMessages);
            break;
          case "userUnavailable":
            setMessages([data.message]);
            break;
          case "error":
            toast.error(data.message);
            break;
          case "success":
            toast.success(data.message);
            // If there's a pending operation, execute it
            if (data.operationId && pendingOperations.has(data.operationId)) {
              const callback = pendingOperations.get(data.operationId);
              if (callback) callback();
              // Remove the pending operation
              setPendingOperations((prev) => {
                const newMap = new Map(prev);
                newMap.delete(data.operationId);
                return newMap;
              });
            }

            // If a room was created, refresh the room list
            if (data.newRoom) {
              console.log("Room created, refreshing room list");
              socketRef.current?.send(
                JSON.stringify({ type: "getRooms", selecteduser })
              );
            }
            break;
          case "activeUsers":
            console.log("Active users received:", data.users);
            setActive(data.users);
            break;
          case "userActive":
            console.log("User active:", data.user);
            setActive((prev) => {
              if (prev.includes(data.user)) return prev;
              return [...prev, data.user];
            });
            break;
          case "userInactive":
            console.log("User inactive:", data.user);
            setActive((prev) => prev.filter((id) => id !== data.user));
            break;
          case "roomMembers":
            if (data.error) {
              console.error("Error fetching members:", data.error);
            } else {
              console.log("Received room members:", data.members);
              setRoomMember(data.members);
            }
            break;
          case "removeMembers":
            if (data.error) {
              console.error("Error Removing members:", data.error);
            } else {
              console.log("Member removed:", data.userId);
              // Update members list after removal
              if (data.userId) {
                setRoomMember((prev) =>
                  prev.filter((member) => member._id !== data.userId)
                );
              } else if (data.roomId) {
                // Fetch updated members
                getRoomMembers(data.roomId);
              }
            }
            break;
          case "memberAdded":
            if (data.error) {
              console.error("Error adding member:", data.error);
            } else {
              console.log("Member added:", data.userId);
              // Refresh the member list
              if (data.roomId) {
                getRoomMembers(data.roomId);
              }
            }
            break;
          case "roomList":
            if (data.error) {
              console.error("Error fetching rooms:", data.error);
            } else {
              console.log("Received rooms:", data.rooms);
              // Update rooms state
              setRooms(data.rooms);
            }
            break;
        }
      } catch (error) {
        console.error("Non-JSON message received", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      // Try to reconnect after a delay
      setTimeout(() => {
        console.log("Attempting to reconnect...");
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [selecteduser]);

  // Add current user to active list when logged in
  useEffect(() => {
    if (isConnected && selecteduser) {
      console.log("Adding current user to active list:", selecteduser);
      setActive((prev) => {
        if (prev.includes(selecteduser)) return prev;
        return [...prev, selecteduser];
      });
    }
  }, [isConnected, selecteduser]);

  const joinRoom = (Room: string, SelectedUser: string) => {
    socketRef.current?.send(
      JSON.stringify({ type: "joinRoom", Room, selecteduser: SelectedUser })
    );
  };

  const sendMessage = (message: string, user: string) => {
    socketRef.current?.send(
      JSON.stringify({ type: "sendMessage", room, message, user })
    );
  };

  const inviteUser = useCallback(
    (invitedby: string, inviteMessage: string, invitedto: string) => {
      // Generate an operation ID
      const operationId = `invite_${Date.now()}`;

      socketRef.current?.send(
        JSON.stringify({
          type: "inviteUser",
          room,
          invitedby,
          inviteMessage,
          invitedto,
          operationId,
        })
      );

      // Add callback to fetch room members after successful invite
      setPendingOperations((prev) => {
        const newMap = new Map(prev);
        newMap.set(operationId, () => getRoomMembers(room));
        return newMap;
      });

      // Update local state immediately (optimistic update)
      if (invitedto) {
        const newMember = users.find((user) => user._id === invitedto);
        if (newMember) {
          setRoomMember((prev) => {
            // Check if member already exists
            if (prev.some((member) => member._id === invitedto)) return prev;
            return [...prev, newMember];
          });
        }
      }
    },
    [room]
  );

  const createRoom = (admin: string, roomName: string, users: string[]) => {
    // Generate an operation ID for room creation
    const operationId = `create_room_${Date.now()}`;

    socketRef.current?.send(
      JSON.stringify({
        type: "createRoom",
        admin,
        room: roomName,
        users,
        operationId,
      })
    );

    // Add callback to refresh rooms after successful creation
    setPendingOperations((prev) => {
      const newMap = new Map(prev);
      newMap.set(operationId, () => {
        socketRef.current?.send(
          JSON.stringify({ type: "getRooms", selecteduser })
        );
      });
      return newMap;
    });
  };

  const getRoomMembers = useCallback((roomId: string) => {
    console.log("Getting room members for:", roomId);
    socketRef.current?.send(
      JSON.stringify({
        type: "getRoomMembers",
        room: roomId,
      })
    );
  }, []);

  const removeRoomMembers = useCallback((roomId: string, userId: string) => {
    // Generate an operation ID
    const operationId = `remove_${Date.now()}`;

    socketRef.current?.send(
      JSON.stringify({
        type: "removeRoomMembers",
        room: roomId,
        userId: userId,
        operationId,
      })
    );

    // Update local state immediately (optimistic update)
    setRoomMember((prev) => prev.filter((member) => member._id !== userId));
  }, []);

  // Add users for the inviteUser function
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch users when the component mounts
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8000/user");
        const data = await response.json();
        setUsers(data.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  return {
    active,
    messages,
    rooms,
    joinRoom,
    setActive,
    sendMessage,
    inviteUser,
    createRoom,
    getRoomMembers,
    roomMember,
    removeRoomMembers,
    isConnected,
  };
};

export default useWebSocket;
