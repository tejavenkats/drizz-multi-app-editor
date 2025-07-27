"use client";
import React, { useEffect, useRef } from "react";
import { Room } from "../Room";
import { RoomProvider, useOthers } from "@liveblocks/react";
import { UserColors } from "@/constants/common";
import Canvas from "./canvas";
import App from "./app";
import { useRouter } from "next/navigation";

export default function Home() {


  const router = useRouter();

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      router.replace("/");
    }
  }, []);

  return (
    <Room>
      <App />
    </Room>
  );
}
