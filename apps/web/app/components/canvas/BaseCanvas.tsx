"use client";
import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Shape, ShapeType, renderShapes, drawRect } from "./CanvasUtils";

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

    // Expose methods to parent components
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
            renderShapes(ctx, existingShapes.current);
          }
        }
      },
    }));

    // Update existing shapes when initialShapes changes
    useEffect(() => {
      existingShapes.current = initialShapes;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          renderShapes(ctx, existingShapes.current);
        }
      }
    }, [initialShapes]);

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

      // Render initial shapes if any 
      if (existingShapes.current.length > 0) {
        renderShapes(ctx, existingShapes.current);
      }

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
        const shape: Shape = {
          type: ShapeType.Rectangle,
          x: startXRef.current,
          y: startYRef.current,
          width,
          height,
        };

        if (!existingShapes.current) {
          existingShapes.current = [];
        }
        existingShapes.current.push(shape);

        // Notify parent component if callback provided
        if (onDrawShape) {
          onDrawShape(shape);
        }

        renderShapes(ctx, existingShapes.current);
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
    }, [onDrawShape]);

    return (
      <canvas
        id="canvas"
        style={{ backgroundColor: "black", width: "100vw", height: "100vh" }}
        ref={canvasRef}
      ></canvas>
    );
  }
);

BaseCanvas.displayName = "BaseCanvas";

export default BaseCanvas;
