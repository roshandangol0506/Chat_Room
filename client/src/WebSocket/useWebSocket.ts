"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

const useWebSocket = (room: string, selecteduser: string) => {
  const socketRef = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<string[]>([])
  const [active, setActive] = useState<string[]>([])

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000")
    socketRef.current = ws

    ws.onopen = () => {
      console.log("WebSocket connected")
      // Request active users immediately on connection
      if (selecteduser) {
        ws.send(JSON.stringify({ type: "requestActiveUsers" }))
      }
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        console.log("WebSocket message received:", data.type)

        switch (data.type) {
          case "message":
            setMessages((prev) => [...prev, data.message])
            break
          case "previousMessages":
            const previousMessages = data.messages.map((msg: any) => `${msg.user.name}: ${msg.message}`)
            setMessages(previousMessages)
            break
          case "userUnavailable":
            setMessages([data.message])
            break
          case "error":
          case "success":
            toast(data.message)
            break
          case "activeUsers":
            console.log("Active users received:", data.users)
            setActive(data.users)
            break
          case "userActive":
            console.log("User active:", data.user)
            setActive((prev) => {
              if (prev.includes(data.user)) return prev
              return [...prev, data.user]
            })
            break
          case "userInactive":
            console.log("User inactive:", data.user)
            setActive((prev) => prev.filter((id) => id !== data.user))
            break
        }
      } catch (error) {
        console.error("Non-JSON message received", error)
      }
    }

    return () => {
      ws.close()
    }
  }, [selecteduser])

  const joinRoom = (Room: string, SelectedUser: string) => {
    socketRef.current?.send(JSON.stringify({ type: "joinRoom", Room, selecteduser }))
  }

  const sendMessage = (message: string, user: string) => {
    socketRef.current?.send(JSON.stringify({ type: "sendMessage", room, message, user }))
  }

  const inviteUser = (invitedby: string, inviteMessage: string, invitedto: string) => {
    socketRef.current?.send(
      JSON.stringify({
        type: "inviteUser",
        room,
        invitedby,
        inviteMessage,
        invitedto,
      }),
    )
  }

  const createRoom = (admin: string, room: string, users: string[]) => {
    socketRef.current?.send(JSON.stringify({ type: "createRoom", admin, room, users }))
  }

  return {
    active,
    messages,
    joinRoom,
    setActive,
    sendMessage,
    inviteUser,
    createRoom,
  }
}

export default useWebSocket
