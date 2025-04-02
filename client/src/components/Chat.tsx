"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import useWebSocket from "@/WebSocket/useWebSocket"
import Sidebar from "./sidebar"
import Navbar from "./navbar"
import MessageList from "./message-list"
import MessageInput from "./message-input"
import { Alert } from "./ui/alert"


export default function Chat() {
  const [room, setRoom] = useState<string>("")
  const [roomAdmin, setRoomAdmin] = useState<string>("");
  const [rooms, setRooms] = useState<{ _id: string; roomName: string; admin: string }[]>([])
  const [users, setUsers] = useState<
    {
      _id: string
      name: string
      username: string
      email: string
    }[]
  >([])
  const [usertoCreateRoom, setusertoCreateRoom] = useState<string[]>([])
  const [inviteUserid, setinviteUserid] = useState<string>("")
  const [roomName, setroomName] = useState("")
  const [loginUser, setLoginUser] = useState<{ id: string; username: string; email: string } | null>(null)
  const { messages, active, sendMessage, setActive, inviteUser, createRoom } = useWebSocket(room, loginUser?.id || "")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createRoomOpen, setCreateRoomOpen] = useState(false)

  const handleRoomChange = (roomId: string, roomAdmin: string) => {
    setRoom(roomId)
    setRoomAdmin(roomAdmin)
  }

  const handleRoomDelete = async (room_id: string, room_admin:string)=>{
    try{
      if (room_admin===loginUser?.id){
      const response = await axios.delete(`http://localhost:8000/deleteroom/${room_id}`)
      setSuccess("Room deleted successfully")
      fetchRoom()
      }
      else{
        setError("You are not authorized to delete this room")
      }
    }
    catch{
      setError("Failed to delete room")
    }
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    setusertoCreateRoom((prevSelected) =>
      checked ? [...prevSelected, userId] : prevSelected.filter((id) => id !== userId),
    )
  }

  const fetchRoom = async () => {
    try {
      const response = await axios.get("http://localhost:8000/getroom")
      setRooms(response.data.data)
      setError(null)
    } catch (error) {
      setError(`Failed to fetch rooms: ${error}`)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:8000/user")
      setUsers(response.data.data)
      setError(null)
    } catch (error) {
      setError(`Failed to fetch Users: ${error}`)
    }
  }

  const handleCreateRoom = async () => {
    if (!roomName || usertoCreateRoom.length === 0) {
      setError("All fields are required")
      return
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/createroom",
        { admin: loginUser?.id, roomName, users: usertoCreateRoom },
        { withCredentials: true },
      )

      setSuccess("Successfully created room")
      setError(null)
      setroomName("")
      setusertoCreateRoom([])
      fetchRoom()
      setCreateRoomOpen(false)
    } catch (error: any) {
      setError(`Failed to create room: ${error.response?.data?.message || error.message}`)
      setSuccess(null)
      setroomName("")
    }
  }

  const handleSendMessage = () => {
    if (message.trim() && loginUser?.id) {
      sendMessage(message, loginUser.id)
      setMessage("")
    }
  }

  useEffect(() => {
    fetchRoom()
    fetchUser()
    fetchLoginUser()
  }, [])

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
          })
        }
      })
  }

  // Find current room name
  const currentRoomName = rooms.find((r) => r._id === room)?.roomName || "Chat"

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
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
        setError= {setError}
        success={success}
        fetchLoginUser={fetchLoginUser}
        handleRoomDelete={handleRoomDelete}
        active={active}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          currentRoomName={currentRoomName}
          room={room}
          roomAdmin={roomAdmin}
          rooms={rooms}
          users={users}
          inviteUserid={inviteUserid}
          setinviteUserid={setinviteUserid}
          loginUser={loginUser}
          inviteUser={inviteUser}
        />

        <MessageList messages={messages} loginUser={loginUser} />

        <MessageInput
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          loginUser={loginUser}
          room={room}
        />
      </div>
    </div>
  )
}

