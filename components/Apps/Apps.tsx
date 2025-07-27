"use client";
import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { FC, useState } from "react";
import { Button } from "../ui/button";
import { FaPlus } from "react-icons/fa6";
import { MdAdd, MdDelete } from "react-icons/md";
import { Input } from "../ui/input";

interface AppsProps {}

const Apps: FC<AppsProps> = () => {
  const apps = useStorage((state) => state.apps);

  const [appName, setAppName] = useState("");

  const addApp = useMutation(
    ({ storage }) => {
      if (appName.trim() === "") {
        return;
      }

      const apps = storage.get("apps") || [];

      const existingApp = apps.find((app) => app.appName === appName);
      if (existingApp) {
        return;
      }

      const newApp = {
        appName: appName,
        appAlias: appName, // You can customize this as needed
      };

      apps.push(newApp);
      setAppName(""); // Clear input after adding
    },
    [appName]
  );

  const deleteApp = useMutation(
    ({ storage }, appName) => {
      const apps = storage.get("apps") || [];
      const appIndex = apps.findIndex((app) => app.appName === appName);
      if (appIndex < 0 || appIndex >= apps.length) {
        return;
      }

      apps.delete(appIndex);
    },
    [apps]
  );

  return (
    <div className="absolute top-[5rem] right-2 border border-slate-300 bg-slate-400 p-4 rounded flex flex-col gap-2">
      <div>List of Apps</div>
      {apps &&
        apps.map((app, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="font-bold">{app.appName}</span>
            <Button
              variant="destructive"
              size="icon"
              className="ml-auto"
              onClick={() => deleteApp(app.appName)}
            >
              <MdDelete />
            </Button>
          </div>
        ))}
      <div className="flex items-end gap-2">
        <div className="flex flex-col items-center gap-2">
          <Input
            type="text"
            placeholder="App Name"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
        </div>
        <Button
          variant={"outline"}
          className="text-[12px] bg-slate-700 text-white"
          onClick={addApp}
        >
          <MdAdd fontSize={12} /> Add
        </Button>
      </div>
    </div>
  );
};

export default Apps;
