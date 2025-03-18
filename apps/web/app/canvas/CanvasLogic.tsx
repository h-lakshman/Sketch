"use client";
import React, { useEffect, useRef, useState } from "react";

const drawRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.strokeRect(x, y, width, height);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
};

const CanvasPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;
    resizeCanvas();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDrawingRef.current = true;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDrawingRef.current) {
        const width = e.clientX - startXRef.current;
        const height = e.clientY - startYRef.current;
        drawRect(ctx, startXRef.current, startYRef.current, width, height);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isDrawingRef.current = false;
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
