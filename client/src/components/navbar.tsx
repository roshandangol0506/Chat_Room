"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users } from "lucide-react"

type NavbarProps = {
  currentRoomName: string
  room: string
  roomAdmin: string
  rooms: { _id: string; roomName: string; admin: string }[]
  users: {
    _id: string
    name: string
    username: string
    email: string
  }[]
  inviteUserid: string
  setinviteUserid: (id: string) => void
  loginUser: { id: string; username: string; email: string } | null
  inviteUser: (from: string, message: string, to: string) => void
}

export default function Navbar({
  currentRoomName,
  room,
  roomAdmin,
  rooms,
  users,
  inviteUserid,
  setinviteUserid,
  loginUser,
  inviteUser,
}: NavbarProps) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold">{currentRoomName}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {rooms.find((r) => r._id === room) ? `Room ID: ${room}` : "Select a room"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400"></p>
        {loginUser?.id === roomAdmin ? `You are admin ${roomAdmin}` : `Admin is ${roomAdmin}`}
      </div>

      <Dialog>
        <DialogTrigger asChild>
        {loginUser?.id === roomAdmin ? <Button variant="outline" size="sm" className="gap-1">
            <Users className="h-4 w-4" />
            Invite
          </Button> : null}
          

        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User to Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={inviteUserid} onValueChange={setinviteUserid}>
              <SelectTrigger>
                <SelectValue placeholder="Select user to invite" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => inviteUser(loginUser?.id || "", `Join ${currentRoomName}!`, inviteUserid)}
              className="w-full"
              disabled={!inviteUserid || !loginUser}
            >
              Send Invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

