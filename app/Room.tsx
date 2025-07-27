"use client";

import { ReactNode, useEffect } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import {
  LiveList,
  LiveMap,
} from "@liveblocks/client";
import { useRouter, useSearchParams } from "next/navigation";
import { filter, get } from "lodash";
import { apps } from "./constants";
import { Shape } from "@/liveblocks.config";


export function Room({ children }: { children: ReactNode }) {
  const roomId = "liveblocks:drizz-canvas-editor:my-room"

  const router = useRouter();

  useEffect(() => {}, []);

  const initialPresence = {
    cursor: null,
    color: null, // Default user color
  };

  const initialStorage = {
    // You can initialize your storage here if needed
    // For example, a list of shapes or objects on the canvas
    apps: new LiveList([]),
    selectedAppId: "",
    shapes: new LiveMap<string, Shape>(),
    videoPositions: new LiveMap<string, { x: number; y: number }>(),
  };

  const authEndpoint = async (room: any) => {
    const headers = {
      "Content-Type": "application/json",
    };

    const user = sessionStorage.getItem("user");
    const userData = user ? JSON.parse(user) : null;
    if (!userData) {
      console.error("No user data found in session storage");
      router.replace("/");
    }

    const body = JSON.stringify({
      // Custom body
      // ...
      ...userData,
    });

    const response = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers,
      body,
    });
    const responseJson = await response.json();

    return responseJson;
  };

  // const apps = useStorage((state) => state.apps);

  return (
    <LiveblocksProvider
      authEndpoint={authEndpoint}
      resolveUsers={async ({ userIds }) => {
        // const searchParams = new URLSearchParams(
        //   userIds.map((userId) => ["userIds", userId])
        // );
        // const response = await fetch(`/api/users?${searchParams}`);

        // if (!response.ok) {
        //   throw new Error("Problem resolving users");
        // }

        // const users = await response.json();

        // return users;
        const sessionData = sessionStorage.getItem("user");
        const selectedApps = sessionData
          ? get(JSON.parse(sessionData), "selectedApps", apps)
          : apps;
        const users = filter(selectedApps, (app) =>
          userIds.includes(app.id)
        ).map((app) => ({
          id: app.id,
          color: app.info.color,
          name: app.info.name,
          avatar: app.info.avatar,
        }));

        return users;
      }}
      resolveMentionSuggestions={async ({ text }) => {
         const sessionData = sessionStorage.getItem("user");
        const selectedApps = sessionData
          ? get(JSON.parse(sessionData), "selectedApps", apps)
          : apps;
        const q = text.toLowerCase().trim();
        return selectedApps
          .filter(
            (app: any) =>
              app.id.toLowerCase().includes(q) ||
              app.info.name.toLowerCase().includes(q)
          )
          .map((app: any) => app.id);
      }}
    >
      <RoomProvider
        id={roomId}
        initialPresence={initialPresence}
        initialStorage={initialStorage}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
