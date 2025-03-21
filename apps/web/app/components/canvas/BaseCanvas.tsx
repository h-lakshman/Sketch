"use client";
import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import {
  Shape,
  ShapeType,
  renderShapes,
  drawRect,
  drawPen,
  drawEllipse,
} from "./CanvasUtils";
import ToolBar, { ToolType } from "./ToolBar";

interface BaseCanvasProps {
  initialShapes?: Shape[];
  onDrawShape?: (shape: Shape) => void;
}

export interface BaseCanvasHandle {
  addShape: (shape: Shape) => void;
}

const BaseCanvas = forwardRef<BaseCanvasHandle, BaseCanvasProps>(
  ({ initialShapes = [], onDrawShape }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawingRef = useRef(false);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const penPointsRef = useRef<{ x: number; y: number }[]>([]);
    const existingShapes = useRef<Shape[]>(initialShapes);
    const [selectedTool, setSelectedTool] = useState<ToolType>("rectangle");
    const [isDarkMode, setIsDarkMode] = useState(true);

    const strokeColor = isDarkMode ? "#ffffff" : "#000000";
    const backgroundColor = isDarkMode ? "#1a1a1a" : "#ffffff";

    const setupContext = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctxRef.current = ctx;
      return ctx;
    };

    useImperativeHandle(ref, () => ({
      addShape: (shape: Shape) => {
        if (!existingShapes.current) {
          existingShapes.current = [];
        }
        existingShapes.current.push(shape);

        const ctx = ctxRef.current;
        if (ctx) {
          renderShapes(ctx, existingShapes.current, strokeColor);
        }
      },
    }));

    useEffect(() => {
      existingShapes.current = initialShapes;
      const ctx = setupContext();
      if (ctx) {
        renderShapes(ctx, existingShapes.current, strokeColor);
      }
    }, [initialShapes, strokeColor]);

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log("canvas not found");
        return;
      }

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setupContext();
    };

    useEffect(() => {
      resizeCanvas();
      const ctx = setupContext();
      if (ctx && existingShapes.current.length > 0) {
        renderShapes(ctx, existingShapes.current, strokeColor);
      }

      const handleMouseDown = (e: MouseEvent) => {
        if (selectedTool === "hand") return;
        isDrawingRef.current = true;
        startXRef.current = e.clientX;
        startYRef.current = e.clientY;

        if (selectedTool === "pen") {
          penPointsRef.current = [{ x: e.clientX, y: e.clientY }];
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDrawingRef.current) return;
        const ctx = ctxRef.current;
        if (!ctx) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        ctx.save();
        renderShapes(ctx, existingShapes.current, strokeColor);

        switch (selectedTool) {
          case "rectangle":
            const width = currentX - startXRef.current;
            const height = currentY - startYRef.current;
            drawRect(
              ctx,
              startXRef.current,
              startYRef.current,
              width,
              height,
              strokeColor
            );
            break;
          case "ellipse":
            const minX = Math.min(currentX, startXRef.current);
            const maxX = Math.max(currentX, startXRef.current);
            const minY = Math.min(currentY, startYRef.current);
            const maxY = Math.max(currentY, startYRef.current);

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const radiusX = (maxX - minX) / 2;
            const radiusY = (maxY - minY) / 2;

            drawEllipse(ctx, centerX, centerY, radiusX, radiusY, strokeColor);
            break;
          case "pen":
            if (!penPointsRef.current) {
              penPointsRef.current = [];
              return;
            }

            // Add new point
            penPointsRef.current.push({ x: currentX, y: currentY });
            // Use the same drawPen function for both live drawing and final shape
            drawPen(ctx, penPointsRef.current, strokeColor);
            break;
        }
        ctx.restore();
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        const currentX = e.clientX;
        const currentY = e.clientY;
        const ctx = ctxRef.current;
        if (!ctx) return;

        let shape: Shape | null = null;

        if (selectedTool === "rectangle") {
          shape = {
            type: ShapeType.Rectangle,
            x: startXRef.current,
            y: startYRef.current,
            width: currentX - startXRef.current,
            height: currentY - startYRef.current,
          };
        } else if (selectedTool === "ellipse") {
          const minX = Math.min(currentX, startXRef.current);
          const maxX = Math.max(currentX, startXRef.current);
          const minY = Math.min(currentY, startYRef.current);
          const maxY = Math.max(currentY, startYRef.current);

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          const radiusX = (maxX - minX) / 2;
          const radiusY = (maxY - minY) / 2;

          shape = {
            type: ShapeType.Ellipse,
            centerX,
            centerY,
            radiusX,
            radiusY,
          };
        } else if (selectedTool === "pen") {
          if (!penPointsRef.current || penPointsRef.current.length < 2) return;

          shape = {
            type: ShapeType.Pen,
            points: [...penPointsRef.current], // Create a copy of the points
          };
          penPointsRef.current = []; // Clear for next stroke
        }

        if (shape) {
          existingShapes.current.push(shape);
          if (onDrawShape) {
            onDrawShape(shape);
          }
          renderShapes(ctx, existingShapes.current, strokeColor);
        }
      };

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("resize", resizeCanvas);

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key.toLowerCase()) {
          case "r":
            setSelectedTool("rectangle");
            break;
          case "e":
            setSelectedTool("ellipse");
            break;
          case "p":
            setSelectedTool("pen");
            break;
          case "h":
            setSelectedTool("hand");
            break;
          case "delete":
            setSelectedTool("eraser");
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("resize", resizeCanvas);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [onDrawShape, selectedTool, strokeColor]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      switch (selectedTool) {
        case "eraser":
          canvas.style.cursor = "crosshair";
          break;
        default:
          canvas.style.cursor = "default";
      }
    }, [selectedTool]);

    return (
      <>
        <ToolBar
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
          isDarkMode={isDarkMode}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        />
        <canvas
          id="canvas"
          style={{
            backgroundColor: backgroundColor,
            width: "100vw",
            height: "100vh",
            transition: "background-color 0.3s ease",
          }}
          ref={canvasRef}
        ></canvas>
      </>
    );
  }
);

BaseCanvas.displayName = "BaseCanvas";

export default BaseCanvas;
