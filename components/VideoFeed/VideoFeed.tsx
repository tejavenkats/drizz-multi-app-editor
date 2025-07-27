"use client";
import { apps } from "@/app/constants";
import { useMutation, useStorage } from "@liveblocks/react";
import { filter, map } from "lodash";
import { FC, useEffect, useRef, useState } from "react";
import { GoGrabber } from "react-icons/go";

interface VideoFeedProps {
    mentionedAppIds: string[];
}

const VideoFeed: FC<VideoFeedProps> = ({ mentionedAppIds }) => {
  const selectedAppId = useStorage((state) => state.selectedAppId);
  const runningEditorCoordinates = useStorage(
    (state) => state.runningEditorCoordinates
  ) || { x: 0, y: 0 };
  const { x: editorX, y: editorY } = runningEditorCoordinates;
  const totalFeeds = apps.length;
  const editorWidth = 350; // width of the editor in px
  const gap = 50; // horizontal gap between feeds in px
  const videoWidth = 200; // width of each video in px (mobile-friendly)
  const videoHeight = 350; // height of each video in px (9:16 aspect ratio)

  // Refs for each video element
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Liveblocks storage for video positions
  const videoPositions = useStorage((state) => state.videoPositions);
  const updateVideoPosition = useMutation(
    ({ storage }, id: string, x: number, y: number) => {
      storage.get("videoPositions")?.set?.(id, { x, y });
    },
    []
  );

  // Local drag state
  const [dragInfo, setDragInfo] = useState<{
    id: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragInfo) return;
      e.preventDefault();
      const dx = e.clientX - dragInfo.startX;
      const dy = e.clientY - dragInfo.startY;
      updateVideoPosition(
        dragInfo.id,
        dragInfo.offsetX + dx,
        dragInfo.offsetY + dy
      );
    };
    const handlePointerUp = () => {
      setDragInfo(null);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragInfo, updateVideoPosition]);
  // Play only the selected app's video, pause others
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (!video) return;
      if (id === selectedAppId) {
        video.play().catch((e) => {
          console.log("Error playing video:", e);
        });
      } else {
        video.pause();
      }
    });
  }, [selectedAppId]);

  const filteredApps = filter(apps, (app) => mentionedAppIds.includes(app.id));

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {map(filteredApps, (app, index) => {
        const defaultX =
          editorX + editorWidth * 1.7 + gap + index * (videoWidth + gap);
        const defaultY = editorY + 300;
        const coords = videoPositions?.get?.(app.id) || { x: defaultX, y: defaultY };
        return (
          <div
            key={app.id}
            className="p-2 rounded flex flex-col gap-2 text-sm"
            style={{
              position: "absolute",
              transform: `translate(${coords.x}px, ${coords.y}px)`,
              pointerEvents: "auto",
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              setDragInfo({
                id: app.id,
                startX: e.clientX,
                startY: e.clientY,
                offsetX: coords.x,
                offsetY: coords.y,
              });
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
          >
            {app.id !== selectedAppId && (
              <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50" />
            )}
            <div className="flex flex-col gap-2 cursor-grab">
              <div className="flex justify-between items-center">{app.info.name} <GoGrabber className="text-lg cursor-grab" /></div>
              <div
                style={{
                  position: "relative",
                  width: videoWidth,
                  height: videoHeight,
                }}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[app.id] = el;
                  }}
                  width={videoWidth}
                  height={videoHeight}
                  src={app.info.videoUrl}
                  controls={false}
                  muted
                  loop
                  style={{
                    width: "100%",
                    height: "100%",
                    pointerEvents: "auto",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VideoFeed;
