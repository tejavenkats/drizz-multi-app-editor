"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@liveblocks/client";
import { findIndex, isEmpty, map } from "lodash";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { apps } from "./constants";

export default function Join() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User>({} as User);
  const [selectedApps, setSelectedApps] = useState<any>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/users/search", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
      });
  }, []);

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (user) {
      router.replace("/playground");
    }
  }, []);

  const joinPlayground = async () => {
    try {
      const userData = {
        ...selectedUser,
        roomId: "example-room",
        selectedApps: selectedApps,
      };
      sessionStorage.setItem("user", JSON.stringify(userData));
      router.replace("/playground");
    } catch (error) {
      console.error("Error joining playground:", error);
    }
  };

  const onValueChange = (value: string) => {
    const selectedUser = users.find((user) => user.id === value);
    if (selectedUser) {
      setSelectedUser(selectedUser);
    }
  };

  console.log("selectedApps", selectedApps);

  const isRoomOrAppSelected = !isEmpty(selectedRoom) || !isEmpty(selectedApps);

  return (
    <div className="flex flex-col gap-8 items-center justify-center h-screen">
      <div className="text-2xl font-bold">Welcome to the Playground</div>
      <Select onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.info.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <hr className="w-[500px]" />
      <div className="flex flex-col gap-4 w-[400px] items-center">
        <div>Select from available Apps</div>
        <div className="flex items-center gap-2 w-full">
          {map(apps, (app) => {
            const isSelected =
              findIndex(
                selectedApps,
                (selectedApp: any) => selectedApp.id === app.id
              ) >= 0;
            return (
              <div
                className={`flex-1/6 text-center border border-slate-500 rounded-md p-2 w-fit cursor-pointer ${
                  isSelected ? "bg-blue-500 text-white" : ""
                }`}
                key={app.id}
                onClick={() => {
                  setSelectedRoom("");
                  setSelectedApps((prev: any) =>
                    isSelected
                      ? prev.filter(
                          (selectedApp: any) => selectedApp.id !== app.id
                        )
                      : [...prev, { ...app }]
                  );
                }}
              >
                {app.info.name}
              </div>
            );
          })}
        </div>
      </div>

      <hr className="w-[300px]" />
      <div>OR</div>
      <hr className="w-[300px]" />

      <div className="flex flex-col gap-2 items-center">
        Select room to join
        <Select
          value={selectedRoom}
          onValueChange={(value) => {
            setSelectedApps(apps);
            setSelectedRoom(value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a room" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="room1">example-room</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <hr className="w-[500px]" />

      <Button
        disabled={isEmpty(selectedUser) || !isRoomOrAppSelected}
        className="w-[400px]"
        onClick={joinPlayground}
      >
        Join
      </Button>
    </div>
  );
}
