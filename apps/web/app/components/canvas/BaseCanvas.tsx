"use client";
import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  Shape,
  ShapeType,
  drawRect,
  drawPen,
  drawEllipse,
  drawLine,
  drawLineWithArrow,
  drawDiamond,
  StrokeStyle,
} from "./CanvasUtils";
import { findShapeAtPoint, areShapesEqual, setupCanvasContext } from "./helper";
import ToolBar, { ToolType } from "./ToolBar";
import SideToolbar from "./SideToolbar";

interface BaseCanvasProps {
  initialShapes?: Shape[];
  onDrawShape?: (shape: Shape) => void;
  onDeleteShape?: (shape: Shape) => void;
}

export interface BaseCanvasHandle {
  addShape: (shape: Shape) => void;
  removeShape: (shape: Shape) => void;
}

const BaseCanvas = forwardRef<BaseCanvasHandle, BaseCanvasProps>(
  ({ initialShapes = [], onDrawShape, onDeleteShape }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawingRef = useRef(false);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const penPointsRef = useRef<{ x: number; y: number }[]>([]);
    const existingShapes = useRef<Shape[]>(initialShapes);
    const [selectedTool, setSelectedTool] = useState<ToolType>("rectangle");
    const [isDarkMode, setIsDarkMode] = useState(true);
    const shapesToDelete = useRef<Set<Shape>>(new Set());
    const isTypingRef = useRef(false);
    const currentTextRef = useRef("");
    const textPositionRef = useRef({ x: 0, y: 0 });
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>(
      StrokeStyle.SOLID
    );
    const cursorBlinkRef = useRef<number | null>(null);
    const [fontSize, setFontSize] = useState(16);
    const [currentStrokeColor, setCurrentStrokeColor] = useState(
      isDarkMode ? "#ffffff" : "#000000"
    );

    const backgroundColor = isDarkMode ? "#1a1a1a" : "#ffffff";
    const highlightColor = "rgba(255, 0, 0, 0.3)"; // Red with 30% opacity for delete preview

    // Add preview shape ref
    const previewShapeRef = useRef<Shape | null>(null);

    const setupContext = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setupCanvasContext(ctx, currentStrokeColor, strokeWidth);
      ctx.setLineDash(
        strokeStyle === StrokeStyle.DASHED
          ? [10, 5]
          : strokeStyle === StrokeStyle.DOTTED
            ? [2, 2]
            : []
      );
      ctxRef.current = ctx;
      return ctx;
    };

    const renderCurrentShapes = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      existingShapes.current.forEach((shape) => {
        // If shape is being previewed for deletion, use highlight color
        const isPreview =
          previewShapeRef.current &&
          areShapesEqual(shape, previewShapeRef.current);
        switch (shape.type) {
          case ShapeType.Rectangle:
            drawRect(
              ctx,
              shape.x,
              shape.y,
              shape.width,
              shape.height,
              shape.color,
              shape.strokeWidth,
              shape.strokeStyle
            );
            break;
          case ShapeType.Ellipse:
            drawEllipse(
              ctx,
              shape.centerX,
              shape.centerY,
              shape.radiusX,
              shape.radiusY,
              shape.color,
              shape.strokeWidth,
              shape.strokeStyle
            );
            break;
          case ShapeType.Pen:
            drawPen(
              ctx,
              shape.points,
              shape.color,
              shape.strokeWidth,
              shape.strokeStyle
            );
            break;
          case ShapeType.Line:
            drawLine(
              ctx,
              shape.startX,
              shape.startY,
              shape.endX,
              shape.endY,
              shape.color,
              shape.strokeWidth,
              shape.strokeStyle
            );
            break;
          case ShapeType.LineWithArrow:
            drawLineWithArrow(
              ctx,
              shape.startX,
              shape.startY,
              shape.endX,
              shape.endY,
              shape.color,
              shape.strokeWidth,
              shape.strokeStyle
            );
            break;
          case ShapeType.Diamond:
            drawDiamond(
              ctx,
              shape.centerX,
              shape.centerY,
              shape.width,
              shape.height,
              shape.color,
              shape.strokeWidth,
              shape.strokeStyle
            );
            break;
          case ShapeType.Text:
            ctx.font = `${shape.fontSize}px Arial`;
            ctx.fillStyle = shape.color;
            ctx.fillText(shape.content, shape.x, shape.y);
            break;
        }
      });
    };

    useImperativeHandle(ref, () => ({
      addShape: (shape: Shape) => {
        existingShapes.current.push(shape);
        const ctx = ctxRef.current;
        if (ctx) {
          renderCurrentShapes();
        }
      },
      removeShape: (shapeToRemove: Shape) => {
        existingShapes.current = existingShapes.current.filter(
          (shape) => !areShapesEqual(shape, shapeToRemove)
        );
        const ctx = ctxRef.current;
        if (ctx) {
          renderCurrentShapes();
        }
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      existingShapes.current = initialShapes;
      ctxRef.current = ctx;
      setupContext();
      renderCurrentShapes();
    }, [initialShapes]);

    useEffect(() => {
      if (isDarkMode) {
        setCurrentStrokeColor("#ffffff");
      } else {
        setCurrentStrokeColor("#000000");
      }
    }, [isDarkMode]);

    const handleMouseDown = (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (selectedTool === "eraser") {
        const shapeToDelete = findShapeAtPoint(existingShapes.current, x, y);
        if (shapeToDelete) {
          shapesToDelete.current.add(shapeToDelete);
          onDeleteShape?.(shapeToDelete);
          existingShapes.current = existingShapes.current.filter(
            (shape) => !areShapesEqual(shape, shapeToDelete)
          );
          previewShapeRef.current = null;
          renderCurrentShapes();
        }
        return;
      }

      isDrawingRef.current = true;
      startXRef.current = x;
      startYRef.current = y;

      if (selectedTool === "pen") {
        penPointsRef.current = [{ x, y }];
      } else if (selectedTool === "text") {
        isTypingRef.current = true;
        textPositionRef.current = { x, y };
        currentTextRef.current = "";
      }
    };

    const handleMouseMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (selectedTool === "eraser") {
        const shapeUnderCursor = findShapeAtPoint(existingShapes.current, x, y);
        if (shapeUnderCursor !== previewShapeRef.current) {
          previewShapeRef.current = shapeUnderCursor;
          renderCurrentShapes();
        }
        return;
      }

      if (!isDrawingRef.current) return;

      const ctx = ctxRef.current;
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderCurrentShapes();

      switch (selectedTool) {
        case "rectangle":
          drawRect(
            ctx,
            startXRef.current,
            startYRef.current,
            x - startXRef.current,
            y - startYRef.current,
            currentStrokeColor,
            strokeWidth,
            strokeStyle
          );
          break;
        case "ellipse":
          drawEllipse(
            ctx,
            (startXRef.current + x) / 2,
            (startYRef.current + y) / 2,
            Math.abs(x - startXRef.current) / 2,
            Math.abs(y - startYRef.current) / 2,
            currentStrokeColor,
            strokeWidth,
            strokeStyle
          );
          break;
        case "pen":
          penPointsRef.current.push({ x, y });
          drawPen(
            ctx,
            penPointsRef.current,
            currentStrokeColor,
            strokeWidth,
            strokeStyle
          );
          break;
        case "line":
          drawLine(
            ctx,
            startXRef.current,
            startYRef.current,
            x,
            y,
            currentStrokeColor,
            strokeWidth,
            strokeStyle
          );
          break;
        case "lineWithArrow":
          drawLineWithArrow(
            ctx,
            startXRef.current,
            startYRef.current,
            x,
            y,
            currentStrokeColor,
            strokeWidth,
            strokeStyle
          );
          break;
        case "diamond":
          drawDiamond(
            ctx,
            (startXRef.current + x) / 2,
            (startYRef.current + y) / 2,
            Math.abs(x - startXRef.current),
            Math.abs(y - startYRef.current),
            currentStrokeColor,
            strokeWidth,
            strokeStyle
          );
          break;
      }
    };

    const handleMouseUp = (e: ReactMouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let shape: Shape | null = null;

      switch (selectedTool) {
        case "rectangle":
          shape = {
            type: ShapeType.Rectangle,
            x: startXRef.current,
            y: startYRef.current,
            width: x - startXRef.current,
            height: y - startYRef.current,
            color: currentStrokeColor,
            strokeWidth: strokeWidth,
            strokeStyle: strokeStyle,
          };
          break;
        case "ellipse":
          shape = {
            type: ShapeType.Ellipse,
            centerX: (startXRef.current + x) / 2,
            centerY: (startYRef.current + y) / 2,
            radiusX: Math.abs(x - startXRef.current) / 2,
            radiusY: Math.abs(y - startYRef.current) / 2,
            color: currentStrokeColor,
            strokeWidth: strokeWidth,
            strokeStyle: strokeStyle,
          };
          break;
        case "pen":
          if (penPointsRef.current.length > 1) {
            shape = {
              type: ShapeType.Pen,
              points: penPointsRef.current,
              color: currentStrokeColor,
              strokeWidth: strokeWidth,
              strokeStyle: strokeStyle,
            };
          }
          break;
        case "line":
          shape = {
            type: ShapeType.Line,
            startX: startXRef.current,
            startY: startYRef.current,
            endX: x,
            endY: y,
            color: currentStrokeColor,
            strokeWidth: strokeWidth,
            strokeStyle: strokeStyle,
          };
          break;
        case "lineWithArrow":
          shape = {
            type: ShapeType.LineWithArrow,
            startX: startXRef.current,
            startY: startYRef.current,
            endX: x,
            endY: y,
            color: currentStrokeColor,
            strokeWidth: strokeWidth,
            strokeStyle: strokeStyle,
          };
          break;
        case "diamond":
          shape = {
            type: ShapeType.Diamond,
            centerX: (startXRef.current + x) / 2,
            centerY: (startYRef.current + y) / 2,
            width: Math.abs(x - startXRef.current),
            height: Math.abs(y - startYRef.current),
            color: currentStrokeColor,
            strokeWidth: strokeWidth,
            strokeStyle: strokeStyle,
          };
          break;
      }

      if (shape) {
        existingShapes.current.push(shape);
        onDrawShape?.(shape);
        renderCurrentShapes();
      }
    };

    const handleKeyDown = (e: ReactKeyboardEvent<HTMLCanvasElement>) => {
      if (!isTypingRef.current) return;

      if (e.key === "Enter") {
        if (currentTextRef.current) {
          const shape: Shape = {
            type: ShapeType.Text,
            x: textPositionRef.current.x,
            y: textPositionRef.current.y,
            content: currentTextRef.current,
            fontSize,
            color: currentStrokeColor,
          };
          existingShapes.current.push(shape);
          onDrawShape?.(shape);
        }
        isTypingRef.current = false;
        currentTextRef.current = "";
        renderCurrentShapes();
      } else if (e.key === "Backspace") {
        currentTextRef.current = currentTextRef.current.slice(0, -1);
        const ctx = ctxRef.current;
        if (ctx) {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          renderCurrentShapes();
          if (currentTextRef.current) {
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = currentStrokeColor;
            ctx.fillText(
              currentTextRef.current,
              textPositionRef.current.x,
              textPositionRef.current.y
            );
          }
        }
      } else if (e.key.length === 1) {
        currentTextRef.current += e.key;
        const ctx = ctxRef.current;
        if (ctx) {
          ctx.font = `${fontSize}px Arial`;
          ctx.fillStyle = currentStrokeColor;
          ctx.fillText(
            currentTextRef.current,
            textPositionRef.current.x,
            textPositionRef.current.y
          );
        }
      }
    };

    // Add blinking cursor for text input
    const drawCursor = () => {
      const ctx = ctxRef.current;
      if (!ctx || !isTypingRef.current) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(
        textPositionRef.current.x +
          ctx.measureText(currentTextRef.current).width,
        textPositionRef.current.y - fontSize
      );
      ctx.lineTo(
        textPositionRef.current.x +
          ctx.measureText(currentTextRef.current).width,
        textPositionRef.current.y
      );
      ctx.strokeStyle = currentStrokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };

    useEffect(() => {
      if (isTypingRef.current) {
        const blinkCursor = () => {
          const ctx = ctxRef.current;
          if (!ctx) return;

          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          renderCurrentShapes();

          if (currentTextRef.current) {
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = currentStrokeColor;
            ctx.fillText(
              currentTextRef.current,
              textPositionRef.current.x,
              textPositionRef.current.y
            );
          }

          drawCursor();
        };

        cursorBlinkRef.current = window.setInterval(blinkCursor, 500);
        return () => {
          if (cursorBlinkRef.current !== null) {
            window.clearInterval(cursorBlinkRef.current);
          }
        };
      }
    }, [isTypingRef.current, currentStrokeColor]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setupContext();

      const handleResize = () => {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        setupContext();
        const ctx = ctxRef.current;
        if (ctx) {
          renderCurrentShapes();
        }
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

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

    // Add effect to clear preview when tool changes
    useEffect(() => {
      if (selectedTool !== "eraser") {
        previewShapeRef.current = null;
        renderCurrentShapes();
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
        <SideToolbar
          strokeWidth={strokeWidth}
          onStrokeWidthChange={(width) => {
            setStrokeWidth(width);
            const ctx = ctxRef.current;
            if (ctx) {
              ctx.lineWidth = width;
              renderCurrentShapes();
            }
          }}
          strokeColor={currentStrokeColor}
          onStrokeColorChange={(color) => {
            setCurrentStrokeColor(color);
            const ctx = ctxRef.current;
            if (ctx) {
              ctx.strokeStyle = color;
            }
          }}
          fontSize={fontSize}
          onFontSizeChange={(size) => {
            setFontSize(size);
            const ctx = ctxRef.current;
            if (ctx) {
              ctx.font = `${size}px Arial`;
              renderCurrentShapes();
            }
          }}
          strokeStyle={strokeStyle}
          onStrokeStyleChange={(style) => {
            setStrokeStyle(style as StrokeStyle);
            const ctx = ctxRef.current;
            if (ctx) {
              ctx.setLineDash(
                style === StrokeStyle.DASHED
                  ? [10, 5]
                  : style === StrokeStyle.DOTTED
                    ? [2, 2]
                    : []
              );
              renderCurrentShapes();
            }
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            backgroundColor,
            cursor:
              selectedTool === "text" && isTypingRef.current
                ? "text"
                : selectedTool === "hand"
                  ? "grab"
                  : "crosshair",
            width: "100vw",
            height: "100vh",
            transition: "background-color 0.3s ease",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        />
      </>
    );
  }
);

BaseCanvas.displayName = "BaseCanvas";

export default BaseCanvas;
