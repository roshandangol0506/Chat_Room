"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import axios from "axios";
import { User, Users } from "lucide-react";

type MemberType = {
  _id: string;
  name: string;
  username: string;
  email: string;
};

type NavbarProps = {
  currentRoomName: string;
  room: string;
  roomAdmin: string;
  roomMembers: MemberType[];
  rooms: { _id: string; roomName: string; admin: string }[];
  users: {
    _id: string;
    name: string;
    username: string;
    email: string;
  }[];
  inviteUserid: string;
  setinviteUserid: (id: string) => void;
  loginUser: { id: string; username: string; email: string } | null;
  inviteUser: (from: string, message: string, to: string) => void;
  fetchRoom: () => void;
  handleRemoveMember: (roomId: string, userId: string) => void;
  setRoomMembers: React.Dispatch<React.SetStateAction<MemberType[]>>;
};

export default function Navbar({
  currentRoomName,
  room,
  roomAdmin,
  roomMembers,
  setRoomMembers,
  rooms,
  users,
  inviteUserid,
  setinviteUserid,
  loginUser,
  inviteUser,
  fetchRoom,
  handleRemoveMember,
}: NavbarProps) {
  const [localMembers, setLocalMembers] = useState(roomMembers);

  // Update local state when props change
  if (JSON.stringify(localMembers) !== JSON.stringify(roomMembers)) {
    setLocalMembers(roomMembers);
  }

  const handleRemoveMemberLocal = async (roomId: string, userId: string) => {
    try {
      // Update local state immediately for responsive UI
      setLocalMembers((prevMembers) =>
        prevMembers.filter((member) => member._id !== userId)
      );

      // Also update parent state
      setRoomMembers((prevMembers) =>
        prevMembers.filter((member) => member._id !== userId)
      );

      // Call API to remove member
      await axios.post(
        "http://localhost:8000/removemember",
        { room_id: roomId, user_id: userId },
        { withCredentials: true }
      );

      // Refresh rooms data in background
      fetchRoom();
    } catch (error: any) {
      console.error(
        `Failed to delete room member: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold">{currentRoomName}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {rooms.find((r) => r._id === room)
            ? `Room ID: ${room}`
            : "Select a room"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loginUser?.id === roomAdmin
            ? `You are admin ${roomAdmin}`
            : `Admin is ${roomAdmin}`}
        </p>
      </div>

      <div className="flex gap-2">
        {loginUser?.id === roomAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <User className="h-4 w-4" />
                Invite
              </Button>
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
                  onClick={() =>
                    inviteUser(
                      loginUser?.id || "",
                      `Join ${currentRoomName}!`,
                      inviteUserid
                    )
                  }
                  className="w-full"
                  disabled={!inviteUserid || !loginUser}
                >
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Users className="h-4 w-4" />
              Members ({localMembers.length})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Total Members ({localMembers.length})</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {localMembers && localMembers.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {localMembers.map((member) => (
                    <li
                      key={member._id}
                      className="p-2 rounded border bg-gray-100 text-sm flex justify-between items-center"
                    >
                      <div className="font-medium truncate">{member.name}</div>
                      {loginUser?.id === roomAdmin && (
                        <Button
                          onClick={() =>
                            handleRemoveMemberLocal(room, member._id)
                          }
                          variant="outline"
                          size="sm"
                          className="ml-2 h-8 flex-shrink-0"
                        >
                          Remove
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No members in this room.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
