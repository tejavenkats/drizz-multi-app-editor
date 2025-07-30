"use client";

import Mention from "@tiptap/extension-mention";
import { apps } from "../../app/constants";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import {
  useLiveblocksExtension,
  useIsEditorReady,
} from "@liveblocks/react-tiptap";
import StarterKit from "@tiptap/starter-kit";
import {
  useMutation,
  useOthers,
  useRoom,
  useSelf,
  useStorage,
  useSyncStatus,
  useThreads,
} from "@liveblocks/react";
import { GoGrabber, GoTrash } from "react-icons/go";
import { IoPlaySharp } from "react-icons/io5";
import { filter, forEach, isEmpty, map } from "lodash";
import { PointerEvent, useMemo, useState } from "react";
import { PiSpinnerGapBold } from "react-icons/pi";
import VideoFeed from "../VideoFeed/VideoFeed";
import EmulatorFeed from "../LiveFeed/LiveFeed";

interface TiptapEditorProps {
  onShapePointerDown: (
    e: PointerEvent<HTMLDivElement>,
    shapeId: string
  ) => void;
  shapeId: string;
}

export default function TiptapEditor({
  onShapePointerDown,
  shapeId,
}: TiptapEditorProps) {
  const liveblocks = useLiveblocksExtension();
  const storageStatus = useSyncStatus({
    smooth: true,
  });
  const isEditorReady = useIsEditorReady();

  const shapeData = useStorage((state) => {
    const matchingShape = state.shapes.get(shapeId);
    return matchingShape;
  });

  const editor = useEditor({
    editorProps: {
      attributes: {
        class:
          "outline-none flex-1 transition-all w-[350px] h-[500px] border  bg-white dark:bg-slate-900 rounded-lg shadow-md p-4",
      },
    },
    extensions: [StarterKit.configure({ history: false }), liveblocks],
    autofocus: "end",
  });

  const [isRunning, setIsRunning] = useState(false);

  const updateSelectedAppId = useMutation(
    ({ storage }, appId: string, isLast: boolean) => {
      storage.update({
        selectedAppId: appId,
      });
      isLast && setIsRunning(false);
    },
    []
  );

  const updateRunningEditorCoordinates = useMutation(
    ({ storage }, x: number, y: number) => {
      storage.update({
        runningEditorCoordinates: { x, y },
      });
    },
    []
  );

  const deleteEdior = useMutation(
    ({ storage }) => {
      storage.get("shapes")?.delete?.(shapeId);
      // Clear the editor’s document before destroying
      editor?.commands.clearContent();
      editor?.commands.blur();
      editor?.destroy();
    },
    [editor, shapeId]
  );

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const mentionedAppIds = useMemo(() => {
    const content = editor?.getJSON();
    const mentions: string[] = [];

    forEach(content?.content, (item) => {
      forEach(item.content, (child) => {
        if (child.type === "liveblocksMention") {
          mentions.push(child.attrs?.id);
        }
      });
    });

    mentions.push("last");
    return mentions;
  }, [editor?.getJSON()]);

  
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [emulatorSerial, setEmulatorSerial] = useState<string | null>(null);
  const [feedUrls, setFeedUrls] = useState<Record<string, string>>({});

  async function runEmulator(appId: string) {
    const appConfig = apps.find((a) => a.id === appId);
    if (!appConfig) return;
    // Start emulator and get feed URL
    const startResp = await fetch("http://localhost:8000/start_emulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Medium_Phone_API_36.0",
        port: appConfig.info.port,
      }),
    });
    const { serial, feed_url } = await startResp.json();
    setEmulatorSerial(serial);
    setFeedUrls((prev) => ({ ...prev, [appId]: feed_url }));
    // manual delay before opening the app
    await delay(5000);
    // open Chrome or Dialer separately
    if (appConfig.info.endpoint === "/open_chrome") {
      await fetch("http://localhost:8000/open_chrome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial }),
      });
    }
    if (appConfig.info.endpoint === "/open_dialer") {
      await fetch("http://localhost:8000/open_dialer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial }),
      });
    }
    setActiveAppId(appId);
  }

  const runEditorContent = async () => {
    setIsRunning(true);

    for (let i = 0; i < mentionedAppIds.length; i++) {
      const mention = mentionedAppIds[i];
      await runEmulator(mention);
      await updateRunningEditorCoordinates(
        shapeData?.x || 0,
        shapeData?.y || 0
      );
      await delay(2000);
      await updateSelectedAppId(mention, i === mentionedAppIds.length - 1);
    }

    setIsRunning(false);
  };

  const selectedByMe = useSelf((me) => me.presence.selectedShape === shapeId);
  const selectedByOthers = useOthers((others) =>
    others.some((other) => other.presence.selectedShape === shapeId)
  );
  const selectionColor = selectedByMe
    ? "blue"
    : selectedByOthers
    ? "green"
    : "transparent";

  return (
    <div
      className="relative flex flex-col w-[350px] h-[500px]"
      style={{
        transform: `translate(${shapeData?.x}px, ${shapeData?.y}px)`,
        transition: !selectedByMe ? "transform 120ms linear" : "none",
        borderColor: selectionColor,
      }}
    >
      <div className="relative flex flex-row justify-between w-full py-16 xl:pl-[250px] pl-[100px] gap-[50px]">
        <div
          className="relative flex flex-1 flex-col gap-2 "
          onPointerDown={(e) => {
            e.stopPropagation();
            onShapePointerDown(e, shapeId);
          }}
        >
          {isEditorReady && (
            <div className="flex justify-between text-xs">
              <div className="flex gap-4 items-center">
                Editor{" "}
                {isRunning ? (
                  <PiSpinnerGapBold className="animate-spin" />
                ) : storageStatus === "synchronizing" ? (
                  <PiSpinnerGapBold className="animate-spin" />
                ) : (
                  <div>
                    <IoPlaySharp
                      className="cursor-pointer"
                      onClick={runEditorContent}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <GoGrabber className="text-lg cursor-grab" />
                <GoTrash className="text-lg cursor-pointer" onClick={deleteEdior} />
              </div>
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
      <VideoFeed mentionedAppIds={mentionedAppIds} feedUrls={feedUrls} />
      {/* <EmulatorFeed mentionedAppIds={mentionedAppIds} /> */}
    </div>
  );
}
