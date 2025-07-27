import { FC, PointerEvent, use, useMemo, useState, useRef } from "react";
import Canvas from "./canvas";
import {
  useMutation,
  useOthers,
  useRoom,
  useSelf,
  useStorage,
  useUpdateMyPresence,
} from "@liveblocks/react";
import { UserColors } from "@/constants/common";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { FaRegCircle, FaRegSquareFull } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import TiptapEditor from "@/components/TextEditor/TextEditor";
import { Avatars } from "@/components/Avatars/Avatars";
import { apps } from "../constants";
import { CiTextAlignLeft } from "react-icons/ci";
import { BsCursorFill } from "react-icons/bs";
import { LiveMap, LiveObject, shallow } from "@liveblocks/client";
import { keys, map, set } from "lodash";
import { Shape } from "@/liveblocks.config";
import VideoFeed from "@/components/VideoFeed/VideoFeed";
import { IoExitOutline } from "react-icons/io5";

interface AppProps {}

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

const App: FC<AppProps> = () => {
  const others = useOthers();
  const room = useRoom();
  const self = useSelf();
  const shapes = useStorage((state) => state.shapes);

  const updateMyPresence = useUpdateMyPresence();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isEditorAlreadyOpen = useMemo(() => {
    return Array.from(shapes?.entries() || []).some(
      ([, shape]) => shape.shapeType === "editor"
    );
  }, [shapes]);

  // const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
  //   // Handle pointer move events here, e.g., update cursor position in presence

  //   updateMyPresence({
  //     cursor: {
  //       x: event.clientX - event.currentTarget.getBoundingClientRect().x,
  //       y: event.clientY - event.currentTarget.getBoundingClientRect().y,
  //     },
  //   });
  // };

  const onCanvasPointerUp = useMutation(
    ({}) => {
      if (!isDragging) {
        updateMyPresence(
          { cursor: null, selectedShape: undefined },
          { addToHistory: true }
        );
      }

      setIsDragging(false);
      // history.resume();
    },
    [isDragging, history]
  );

  const onCanvasPointerMove = useMutation(
    ({ storage, self }, event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const relativeY = event.clientY - rect.top;
      const xRatio = relativeX / rect.width;
      const yRatio = relativeY / rect.height;
      updateMyPresence({
        cursor: { xRatio, yRatio },
      });
      if (!isDragging) {
        return;
      }
      const shapeId = self.presence.selectedShape;
      if (!shapeId) {
        return;
      }
      const newX = event.clientX - rect.left - dragOffsetRef.current.x;
      const newY = event.clientY - rect.top - dragOffsetRef.current.y;
      const shape = storage.get("shapes").get(shapeId);
      if (shape) {
        shape.update({ x: newX, y: newY });
      }
    },
    [isDragging]
  );

  const onPointerLeave = () => {
    // Handle pointer leave events here, e.g., reset cursor position in presence
    updateMyPresence({ cursor: null });
  };

  const handleEditorClick = () => {
    // Handle editor click logic here
    insertEditorShape();
  };

  const onShapePointerDown = useMutation(
    (
      { storage, setMyPresence },
      e: PointerEvent<HTMLDivElement>,
      shapeId: string
    ) => {
      e.stopPropagation();
      if (!containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const shapeData = storage.get("shapes").get(shapeId);
      const offsetX = e.clientX - rect.left - (shapeData?.get("x") ?? 0);
      const offsetY = e.clientY - rect.top - (shapeData?.get("y") ?? 0);
      dragOffsetRef.current = { x: offsetX, y: offsetY };
      setMyPresence({ selectedShape: shapeId });
      setIsDragging(true);
    },
    []
  );

  const insertEditorShape = useMutation(async ({ storage, setMyPresence }) => {
    const shapeId = Date.now().toString();
    const shapeObject = new LiveObject({
      x: getRandomInt(300),
      y: getRandomInt(300),
      shapeType: "editor",
    });
    console.log("Inserting editor shape with ID:", shapeId);
    console.log("Shape object:", storage.get("shapes"));

    storage.get("shapes").set(shapeId, shapeObject);
    setMyPresence({ selectedShape: shapeId });
  }, []);

  const handleGrabClick = () => {
    // Handle grab click logic here
    console.log("Grab clicked");
  };

  const navItems = [
    {
      label: "Editor",
      icon: <CiTextAlignLeft className="w-4 h-4" />,
      onClick: handleEditorClick,
      isDisabled: isEditorAlreadyOpen,
    },
  ];

  const roomId = useMemo(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedData = JSON.parse(userData);
      return parsedData.roomId;
    }
    return null;
  }, []);

  const shapeIds = useMemo(() => {
    if (!shapes) return [];
    return Array.from(shapes.entries()).map(([id, shape]) => id);
  }, [shapes]);

  const exitRoom = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="flex gap-4 flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
        <div className=" p-2 border border-slate-800 rounded text-xs ">
          Room ID: {roomId}
        </div>
        <Button size={"sm"} variant={"destructive"} onClick={exitRoom}>
          <IoExitOutline />
        </Button>
      </div>

      <nav className="flex gap-4 items-center border-b-2 w-full p-4">
        {navItems.map((item) => (
          <Button
            key={item.label}
            className="p-4 flex items-center gap-2"
            onClick={item.onClick}
            disabled={item.isDisabled}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
      </nav>
      <div
        ref={containerRef}
        className="container w-[100vw] h-[100vh] relative"
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerEnter={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const relativeX = e.clientX - rect.left;
          const relativeY = e.clientY - rect.top;
          const xRatio = relativeX / rect.width;
          const yRatio = relativeY / rect.height;
          updateMyPresence({ cursor: { xRatio, yRatio } });
        }}
      >
        {others &&
          others.map((other) => {
            const connId = other.connectionId;
            const randomIndex = Math.floor(connId % UserColors.length);
            const color = other.info.color;
            if (!other.presence.cursor) return null;
            if (!containerRef.current) return null;
            const { xRatio, yRatio } = other.presence.cursor || {};
            return (
              <div
                className="absolute flex flex-col gap-1 z-20"
                style={{
                  left: `${(xRatio ?? 0) * 100}%`,
                  top: `${(yRatio ?? 0) * 100}%`,
                }}
              >
                <div
                  key={other.connectionId}
                  className={`w-3 h-3 rounded-full bg-white z-20 text-[10px]`}
                  style={{
                    backgroundColor: color,
                  }}
                />
                <div
                  className="text-[10px] px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: color,
                    color: "white",
                  }}
                >
                  {other.info.name}
                </div>
              </div>
            );
          })}
        {map(shapeIds, (shapeId: string) => {
          const shape = shapes?.get(shapeId);
          if (shape?.shapeType === "editor") {
            return (
              <TiptapEditor
                key={shapeId}
                shapeId={shapeId}
                onShapePointerDown={onShapePointerDown}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default App;
