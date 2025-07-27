"use client";
import { FC, useEffect, useRef } from "react";
import * as fabric from "fabric";

interface CanvasProps {}

const Canvas: FC<CanvasProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current!, {
      width: window.innerWidth - window.innerWidth * 0.1,
      height: window.innerHeight - window.innerHeight * 0.1,
    });
    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <canvas id="canvas" className="border border-slate-700 bg-slate-800" ref={canvasRef} />
    </div>
  );
};

export default Canvas;
