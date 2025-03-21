"use client";
import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import { Shape, ShapeType, renderShapes, drawRect } from "./CanvasUtils";
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
    const isDrawingRef = useRef(false);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const existingShapes = useRef<Shape[]>(initialShapes);
    const [selectedTool, setSelectedTool] = useState<ToolType>("rectangle");
    const [isDarkMode, setIsDarkMode] = useState(true);

    const strokeColor = isDarkMode ? "#ffffff" : "#000000";
    const backgroundColor = isDarkMode ? "#1a1a1a" : "#ffffff";

    useImperativeHandle(ref, () => ({
      addShape: (shape: Shape) => {
        if (!existingShapes.current) {
          existingShapes.current = [];
        }
        existingShapes.current.push(shape);

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            renderShapes(ctx, existingShapes.current, strokeColor);
          }
        }
      },
    }));

    useEffect(() => {
      existingShapes.current = initialShapes;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          renderShapes(ctx, existingShapes.current, strokeColor);
        }
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
    };

    useEffect(() => {
      resizeCanvas();
      const canvas = canvasRef.current;

      if (!canvas) {
        console.log("canvas not found");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.log("canvas context not found");
        return;
      }

      if (existingShapes.current.length > 0) {
        renderShapes(ctx, existingShapes.current, strokeColor);
      }

      const handleMouseDown = (e: MouseEvent) => {
        if (selectedTool === "hand") return;

        isDrawingRef.current = true;
        startXRef.current = e.clientX;
        startYRef.current = e.clientY;
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDrawingRef.current) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        ctx.save();
        renderShapes(ctx, existingShapes.current, strokeColor);

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;

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

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.stroke();
            break;
          case "pen":
            ctx.beginPath();
            ctx.moveTo(startXRef.current, startYRef.current);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            startXRef.current = currentX;
            startYRef.current = currentY;
            break;
        }
        ctx.restore();
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        const currentX = e.clientX;
        const currentY = e.clientY;

        if (selectedTool === "rectangle") {
          const shape: Shape = {
            type: ShapeType.Rectangle,
            x: startXRef.current,
            y: startYRef.current,
            width: currentX - startXRef.current,
            height: currentY - startYRef.current,
          };

          if (!existingShapes.current) {
            existingShapes.current = [];
          }
          existingShapes.current.push(shape);

          if (onDrawShape) {
            onDrawShape(shape);
          }

          ctx.save();
          renderShapes(ctx, existingShapes.current, strokeColor);
          ctx.restore();
        } else if (selectedTool === "ellipse") {
          const minX = Math.min(currentX, startXRef.current);
          const maxX = Math.max(currentX, startXRef.current);
          const minY = Math.min(currentY, startYRef.current);
          const maxY = Math.max(currentY, startYRef.current);

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          const radiusX = (maxX - minX) / 2;
          const radiusY = (maxY - minY) / 2;

          const shape: Shape = {
            type: ShapeType.Ellipse,
            centerX,
            centerY,
            radiusX,
            radiusY,
          };

          if (!existingShapes.current) {
            existingShapes.current = [];
          }
          existingShapes.current.push(shape);

          if (onDrawShape) {
            onDrawShape(shape);
          }

          ctx.save();
          renderShapes(ctx, existingShapes.current, strokeColor);
          ctx.restore();
        }
      };

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
