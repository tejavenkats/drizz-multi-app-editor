// components/EmulatorFeed.tsx
import { apps } from "@/app/constants";
import { map } from "lodash";
import { useEffect, useState } from "react";

interface EmulatorFeedProps {
  serial?: string; // e.g. "emulator-5554"
  width?: number | string; // optional styling
  height?: number | string;
  mentionedAppIds?: string[]; // optional, for future use
}

export default function EmulatorFeed({
  serial,
  width = "100%",
  height = "auto",
  mentionedAppIds = [],
}: EmulatorFeedProps) {
  const [src, setSrc] = useState<string>("");
  const [appSerials, setAppSerials] = useState<string[]>([]);

  useEffect(() => {
    // Filter the apps based on mentionedAppIds
    const filteredApps = apps.filter((app) => mentionedAppIds.includes(app.id));
    setAppSerials(filteredApps.map((app) => {
        const serial = `emulator-${app.info.port}`;
        return `http://localhost:8000/video_feed/${serial}`
    }));
  }, [mentionedAppIds]);

//   useEffect(() => {
//     // Build the URL once on the client
//     setSrc(`http://localhost:8000/video_feed/${serial}`);
//   }, [serial]);

  
  // Just render the MJPEG stream as an <img>
  return (
    map(appSerials, (appSrc, index) => (
      <div key={index} style={{ width, height, position: "relative" }}>
        <img
          src={appSrc}
          alt={`Emulator Feed ${index + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    ))
  );
}
