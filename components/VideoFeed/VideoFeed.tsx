"use client";
import { apps } from "@/app/constants";
import { useMutation, useStorage } from "@liveblocks/react";
import { filter, map } from "lodash";
import { FC, useEffect, useRef, useState } from "react";
import { GoGrabber } from "react-icons/go";

interface VideoFeedProps {
  mentionedAppIds: string[];
  feedUrls: Record<string, string>;
}

const VideoFeed: FC<VideoFeedProps> = ({ mentionedAppIds, feedUrls }) => {
  // a key to force new <img> connections when feeds update
  const [streamKey, setStreamKey] = useState(0);
  const [loadedFeeds, setLoadedFeeds] = useState<string[]>([]);

  useEffect(() => {
    // bump key whenever feed URLs or mentioned apps change
    setStreamKey((prev) => prev + 1);
  }, [JSON.stringify(feedUrls), JSON.stringify(mentionedAppIds)]);

  useEffect(() => {
    if (mentionedAppIds.every(id => loadedFeeds.includes(id))) {
      // all feeds loaded; you can now safely call your open endpoints
      mentionedAppIds.forEach(id => {
        const serial = `emulator-${apps.find(a => a.id === id)?.info.port}`;
        // example: call open_chrome for each serial
        fetch('http://localhost:8000/open_chrome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serial }),
        });
      });
    }
  }, [loadedFeeds]);

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

  // Build feed list using feedUrls or fallback to port-based URL, append streamKey to bust previous MJPEG connections
  const feeds = mentionedAppIds.map(id => {
    const appConfig = apps.find(app => app.id === id);
    const baseUrl =
      feedUrls[id] ||
      `http://localhost:8000/video_feed/emulator-${appConfig?.info.port}`;
    // append streamKey to bust previous MJPEG connections
    const separator = baseUrl.includes("?") ? "&" : "?";
    const videoUrl = `${baseUrl}${separator}key=${streamKey}`;
    return { id, video: videoUrl };
  });

  console.log("Video feeds:", feeds, feedUrls);
  

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
      {map(feeds, (app, index) => {
        const defaultX =
          editorX + editorWidth * 1.7 + gap + index * (videoWidth + gap);
        const defaultY = editorY + 300;
        const coords = videoPositions?.get?.(app.id) || {
          x: defaultX,
          y: defaultY,
        };
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
            <div key={index} style={{ width: "100%", height: "auto", position: "relative" }}>
              <img
                src={app.video}
                alt={`Emulator Feed ${index + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onLoad={() => {
                  if (!loadedFeeds.includes(app.id)) {
                    setLoadedFeeds(prev => [...prev, app.id]);
                  }
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VideoFeed;
