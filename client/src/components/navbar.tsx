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
import { useState, useEffect } from "react";
import { User, Users } from "lucide-react";

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

type NavbarProps = {
  currentRoomName: string;
  room: string;
  roomAdmin: string;
  roomMembers: MemberType[];
  rooms: RoomType[];
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
  fetchRoom?: () => void;
  setRoomMembers: React.Dispatch<React.SetStateAction<MemberType[]>>;
  getRoomMembers: (roomId: string) => void;
  roomMember: {
    _id: string;
    name: string;
    username: string;
    email: string;
  }[];
  removeRoomMembers: (roomId: string, userId: string) => void;
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
  roomMember,
  getRoomMembers,
  removeRoomMembers,
}: NavbarProps) {
  // Local state to track dialog open state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  // Get the current room
  const currentRoom = rooms.find((r) => r._id === room);

  // Extract admin ID correctly whether it's a string or object
  const adminId = currentRoom?.admin
    ? typeof currentRoom.admin === "string"
      ? currentRoom.admin
      : currentRoom.admin?._id || ""
    : "";

  // Extract admin name for display
  const adminName = currentRoom?.admin
    ? typeof currentRoom.admin !== "string"
      ? currentRoom.admin?.name || "Unknown"
      : "Unknown"
    : "Unknown";

  // Ensure room members are loaded when the room changes
  useEffect(() => {
    if (room) {
      getRoomMembers(room);
    }
  }, [room, getRoomMembers]);

  const handleRemoveMemberLocal = (roomId: string, userId: string) => {
    // We no longer need to call getRoomMembers immediately after
    // since the WebSocket hook handles updating the state
    removeRoomMembers(roomId, userId);
  };

  const handleInviteRoomMember = (
    invitedby: string,
    roomName: string,
    invitedto: string
  ) => {
    inviteUser(invitedby, `Join ${roomName}!`, invitedto);
    // Close the dialog
    setInviteDialogOpen(false);
    // Clear the selected user
    setinviteUserid("");
  };

  const isUserAdmin = loginUser?.id === adminId;

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold">{currentRoomName}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {currentRoom ? `Room ID: ${room}` : "Select a room"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isUserAdmin
            ? `You are admin (${adminId})`
            : `Admin is ${adminName} (${adminId})`}
        </p>
      </div>

      <div className="flex gap-2">
        {isUserAdmin && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
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
                    {users
                      .filter(
                        (user) =>
                          !roomMember.some((member) => member._id === user._id)
                      )
                      .map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() =>
                    handleInviteRoomMember(
                      loginUser?.id || "",
                      currentRoomName,
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

        <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Users className="h-4 w-4" />
              Members ({roomMember.length})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Total Members ({roomMember.length})</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {roomMember && roomMember.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {roomMember.map((member) => (
                    <li
                      key={member._id}
                      className="p-2 rounded border bg-gray-100 text-sm flex justify-between items-center"
                    >
                      <div className="font-medium truncate">{member.name}</div>
                      {isUserAdmin && member._id !== loginUser?.id && (
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
