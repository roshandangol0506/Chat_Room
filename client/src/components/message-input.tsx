"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import type { KeyboardEvent } from "react"

type MessageInputProps = {
  message: string
  setMessage: (message: string) => void
  handleSendMessage: () => void
  loginUser: { id: string; username: string; email: string } | null
  room: string
}

export default function MessageInput({ message, setMessage, handleSendMessage, loginUser, room }: MessageInputProps) {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="flex space-x-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          disabled={!loginUser || !room}
        />
        <Button onClick={handleSendMessage} disabled={!message.trim() || !loginUser || !room}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {(!loginUser || !room) && (
        <p className="text-xs text-red-500 mt-1">
          {!loginUser ? "Please log in to send messages" : "Please select a room"}
        </p>
      )}
    </div>
  )
}

