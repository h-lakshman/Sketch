"use client";
import { WEBSOCKET_URL } from "@/app/config";
import React, { useEffect, useRef, useState } from "react";

enum ShapeType {
  Rectangle = "rectangle",
}

interface Rectangle {
  type: ShapeType.Rectangle;
  x: number;
  y: number;
  width: number;
  height: number;
}
type Shapes = Rectangle;

const drawRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  ctx.strokeRect(x, y, width, height);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
};

const clearCanvas = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

const renderShapes = (ctx: CanvasRenderingContext2D, shapes: Shapes[]) => {
  clearCanvas(ctx);
  shapes.forEach((shape) => {
    if (shape.type === ShapeType.Rectangle) {
      drawRect(ctx, shape.x, shape.y, shape.width, shape.height);
    }
  });
};

const CanvasPage = ({ socket, roomId }: { socket: WebSocket, roomId: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const existingShapes = useRef<Shapes[]>([]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("canvas not found");
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      console.log("canvas not found");
      return;
    }
    resizeCanvas();

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.log("canvas context not found");
      return;
    }
    renderShapes(ctx, existingShapes.current);

    const handleMouseDown = (e: MouseEvent) => {
      isDrawingRef.current = true;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDrawingRef.current) {
        const width = e.clientX - startXRef.current;
        const height = e.clientY - startYRef.current;
        renderShapes(ctx, existingShapes.current);
        drawRect(ctx, startXRef.current, startYRef.current, width, height);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isDrawingRef.current = false;
      const width = e.clientX - startXRef.current;
      const height = e.clientY - startYRef.current;
      existingShapes.current.push({
        type: ShapeType.Rectangle,
        x: startXRef.current,
        y: startYRef.current,
        width,
        height,
      });
    };
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);
  return (
    <canvas
      id="canvas"
      style={{ backgroundColor: "black", width: "100vw", height: "100vh" }}
      ref={canvasRef}
    ></canvas>
  );
};

export default CanvasPage;
