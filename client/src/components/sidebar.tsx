"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Plus,
  Settings,
  Edit,
  Key,
  LogOut,
  Save,
  Camera,
  X,
  Trash,
  Circle,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

type SidebarProps = {
  rooms: { _id: string; roomName: string; admin: string; users: string[] }[];
  users: {
    _id: string;
    name: string;
    username: string;
    email: string;
  }[];
  loginUser: { id: string; username: string; email: string } | null;
  handleRoomChange: (
    roomId: string,
    roomAdmin: string,
    roomUsers: string[] // Changed this from user objects to string IDs
  ) => void;
  createRoomOpen: boolean;
  setCreateRoomOpen: (open: boolean) => void;
  roomName: string;
  setroomName: (name: string) => void;
  usertoCreateRoom: string[];
  handleUserSelection: (userId: string, checked: boolean) => void;
  handleCreateRoom: () => void;
  handleRoomDelete: (room_id: string, room_admin: string) => void;
  setError: (error: string) => void;
  error: string | null;
  success: string | null;
  fetchLoginUser: () => void;
  active: string[];
};

export default function Sidebar({
  rooms,
  users,
  loginUser,
  handleRoomChange,
  createRoomOpen,
  setCreateRoomOpen,
  roomName,
  setroomName,
  usertoCreateRoom,
  handleUserSelection,
  handleCreateRoom,
  setError,
  error,
  success,
  fetchLoginUser,
  handleRoomDelete,
  active,
}: SidebarProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchuserlogout = async () => {
    try {
      const response = await axios.get("http://localhost:8000/userlogout", {
        withCredentials: true,
      });

      if (response.status === 200) {
        window.location.href = "/login";
      } else {
        setError("Logout request failed:");
      }
    } catch (error) {
      setError(`Error logging out:, ${error}`);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleEditProfile = () => {
    if (loginUser) {
      setEditedUsername(loginUser.username);
      setEditedEmail(loginUser.email);
      setIsEditingProfile(true);
      setIsChangingPassword(false);
    }
  };

  const handleChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsChangingPassword(true);
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    try {
      if (!loginUser) {
        setError("Login user data not available");
        return;
      }

      const response = await axios.put(
        `http://localhost:8000/edituser/${loginUser.id}`,
        { name: editedUsername, email: editedEmail },
        { withCredentials: true }
      );

      if (response.status === 200) {
        console.log("User updated successfully");
        await fetchLoginUser(); // ✅ Ensure latest data is fetched
      } else {
        setError("Failed to edit user");
      }
    } catch (error) {
      setError("Failed to edit user");
    }

    setIsEditingProfile(false);
    setProfileError(null);
  };

  const handleSavePassword = async () => {
    if (!currentPassword) {
      toast("Current password is required");
      return;
    }

    if (!newPassword) {
      toast("New password is required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast("New Passwords do not match with confirm new password");
      return;
    }

    try {
      if (!loginUser) {
        setError("Login user data not available");
        return;
      }

      const response = await axios.put(
        `http://localhost:8000/edituserpassword/${loginUser.id}`,
        { currentPassword: currentPassword, newPassword: newPassword },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast("Password updated successfully");
      } else {
        toast(
          `Failed to edit Password: ${response.data.error || "Unknown error"}`
        );
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast(
          `Error: ${error.response?.data?.error || "Failed to edit Password"}`
        );
      } else {
        toast("An unexpected error occurred");
      }
    }

    setIsChangingPassword(false);
    setProfileError(null);
  };

  const handleUploadProfilePicture = () => {
    // This would typically open a file picker
    console.log("Upload profile picture");
    // In a real implementation, you would handle the file upload
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat App
        </h1>
      </div>

      <Tabs
        defaultValue="rooms"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent
          value="rooms"
          className="flex-1 flex flex-col p-2 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-2 px-2">
            <h2 className="text-sm font-medium">Your Rooms</h2>
            <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      value={roomName}
                      onChange={(e) => setroomName(e.target.value)}
                      placeholder="Enter room name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Users</Label>
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      <div className="space-y-2">
                        {users.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`user-${user._id}`}
                              checked={usertoCreateRoom.includes(user._id)}
                              onCheckedChange={(checked) =>
                                handleUserSelection(
                                  user._id,
                                  checked as boolean
                                )
                              }
                            />
                            <Label
                              htmlFor={`user-${user._id}`}
                              className="flex items-center gap-2"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{user.name}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}
                  <Button onClick={handleCreateRoom} className="w-full">
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 px-1">
              {rooms.map((room) => (
                <div key={room._id} className="flex flex-row items-center">
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() =>
                      handleRoomChange(room._id, room.admin, room.users)
                    }
                  >
                    # {room.roomName}
                  </Button>

                  <Button
                    className="ml-auto p-1 h-8 w-8 flex items-center justify-center"
                    onClick={() => handleRoomDelete(room._id, room.admin)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="users" className="flex-1 p-2 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex-row"
                >
                  <Avatar>
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Circle
                    size={12}
                    className={`ml-2 ${
                      active.includes(user._id)
                        ? "text-green-500 bg-green-500 rounded-full" // Active (green dot)
                        : "text-gray-500 bg-gray-500 rounded-full" // Inactive (gray dot)
                    }`}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Fixed footer - using mt-auto to push it to the bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 mt-auto">
        {loginUser ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {loginUser.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {loginUser.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {loginUser.email}
                </p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>User Settings</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <div className="flex items-center justify-center mb-6 relative">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-lg">
                        {loginUser.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditingProfile && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleUploadProfilePicture}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {profileError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    {!isChangingPassword && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {isEditingProfile
                            ? "Edit Profile"
                            : "User Information"}
                        </h3>
                        <Separator className="my-2" />

                        {isEditingProfile ? (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label htmlFor="username">Username</Label>
                              <Input
                                id="username"
                                value={editedUsername}
                                onChange={(e) =>
                                  setEditedUsername(e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={editedEmail}
                                onChange={(e) => setEditedEmail(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="userId">User ID</Label>
                              <Input
                                id="userId"
                                value={loginUser.id}
                                disabled
                                className="opacity-50"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                User ID cannot be changed
                              </p>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="default"
                                className="flex-1"
                                onClick={handleSaveProfile}
                              >
                                <Save className="mr-2 h-4 w-4" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsEditingProfile(false)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="font-medium">Username:</div>
                            <div>{loginUser.username}</div>
                            <div className="font-medium">Email:</div>
                            <div>{loginUser.email}</div>
                            <div className="font-medium">User ID:</div>
                            <div className="truncate">{loginUser.id}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {isChangingPassword && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Change Password
                        </h3>
                        <Separator className="my-2" />

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="currentPassword">
                              Current Password
                            </Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={currentPassword}
                              onChange={(e) =>
                                setCurrentPassword(e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="confirmPassword">
                              Confirm New Password
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="default"
                              className="flex-1"
                              onClick={handleSavePassword}
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setIsChangingPassword(false)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isEditingProfile && !isChangingPassword && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Account Settings
                        </h3>
                        <Separator className="my-2" />
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          size="sm"
                          onClick={handleEditProfile}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          size="sm"
                          onClick={handleChangePassword}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Change Password
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          size="sm"
                          onClick={fetchuserlogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Not logged in</p>
        )}
      </div>
    </div>
  );
}
