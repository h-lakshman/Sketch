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
  Rectangle,
  Ellipse,
  Pen,
  Line,
  LineWithArrow,
  Diamond,
  Text,
  drawLine,
  drawLineWithArrow,
  drawDiamond,
  drawText,
} from "./CanvasUtils";
import ToolBar, { ToolType } from "./ToolBar";

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

    const strokeColor = isDarkMode ? "#ffffff" : "#000000";
    const backgroundColor = isDarkMode ? "#1a1a1a" : "#ffffff";
    const highlightColor = "rgba(255, 0, 0, 0.3)"; // Red,30% op,preview delete

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

    const findShapeAtPoint = (x: number, y: number): Shape | null => {
      // Search in reverse order (top to bottom in z-index)
      for (let i = existingShapes.current.length - 1; i >= 0; i--) {
        const shape = existingShapes.current[i];
        const threshold = 5;

        switch (shape.type) {
          case ShapeType.Rectangle:
            const rect = shape;

            // Top edge
            if (
              distanceToLineSegment(
                rect.x,
                rect.y,
                rect.x + rect.width,
                rect.y,
                x,
                y
              ) <= threshold
            ) {
              return shape;
            }
            // Right edge
            if (
              distanceToLineSegment(
                rect.x + rect.width,
                rect.y,
                rect.x + rect.width,
                rect.y + rect.height,
                x,
                y
              ) <= threshold
            ) {
              return shape;
            }
            // Bottom edge
            if (
              distanceToLineSegment(
                rect.x,
                rect.y + rect.height,
                rect.x + rect.width,
                rect.y + rect.height,
                x,
                y
              ) <= threshold
            ) {
              return shape;
            }
            // Left edge
            if (
              distanceToLineSegment(
                rect.x,
                rect.y,
                rect.x,
                rect.y + rect.height,
                x,
                y
              ) <= threshold
            ) {
              return shape;
            }
            break;

          case ShapeType.Ellipse:
            const ellipse = shape;
            const normalizedX = (x - ellipse.centerX) / ellipse.radiusX;
            const normalizedY = (y - ellipse.centerY) / ellipse.radiusY;
            const distanceFromCircumference = Math.abs(
              normalizedX * normalizedX + normalizedY * normalizedY - 1
            );
            if (distanceFromCircumference <= 0.15) {
              return shape;
            }
            break;

          case ShapeType.Pen:
            for (let j = 1; j < shape.points.length; j++) {
              const p1 = shape.points[j - 1];
              const p2 = shape.points[j];
              const distance = distanceToLineSegment(
                p1.x,
                p1.y,
                p2.x,
                p2.y,
                x,
                y
              );
              if (distance < threshold) {
                return shape;
              }
            }
            break;

          case ShapeType.Line:
          case ShapeType.LineWithArrow:
            const line = shape;
            const lineDistance = distanceToLineSegment(
              line.startX,
              line.startY,
              line.endX,
              line.endY,
              x,
              y
            );
            if (lineDistance <= threshold) {
              return shape;
            }
            break;

          case ShapeType.Diamond:
            const diamond = shape;
            const halfWidth = diamond.width / 2;
            const halfHeight = diamond.height / 2;

            // Check each edge of the diamond
            const diamondPoints = [
              { x: diamond.centerX, y: diamond.centerY - halfHeight }, // Top
              { x: diamond.centerX + halfWidth, y: diamond.centerY }, // Right
              { x: diamond.centerX, y: diamond.centerY + halfHeight }, // Bottom
              { x: diamond.centerX - halfWidth, y: diamond.centerY }, // Left
            ];

            for (let j = 0; j < diamondPoints.length; j++) {
              const p1 = diamondPoints[j];
              const p2 = diamondPoints[(j + 1) % diamondPoints.length];
              const distance = distanceToLineSegment(
                p1.x,
                p1.y,
                p2.x,
                p2.y,
                x,
                y
              );
              if (distance <= threshold) {
                return shape;
              }
            }
            break;

          case ShapeType.Text:
            const text = shape;
            // For text, check if point is within a rectangle around the text
            const textHeight = text.fontSize;
            const ctx = ctxRef.current;
            if (ctx) {
              ctx.font = `${text.fontSize}px Arial`;
              const textWidth = ctx.measureText(text.content).width;
              if (
                x >= text.x &&
                x <= text.x + textWidth &&
                y >= text.y - textHeight &&
                y <= text.y
              ) {
                return shape;
              }
            }
            break;
        }
      }
      return null;
    };

    const distanceToLineSegment = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      px: number,
      py: number
    ): number => {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;

      if (lenSq !== 0) {
        param = dot / lenSq;
      }

      let xx, yy;

      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      const dx = px - xx;
      const dy = py - yy;
      return Math.sqrt(dx * dx + dy * dy);
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
      removeShape: (shapeToRemove: Shape) => {
        existingShapes.current = existingShapes.current.filter((shape) => {
          if (shape.type !== shapeToRemove.type) return true;

          switch (shape.type) {
            case ShapeType.Rectangle:
              const rectShape = shape as Rectangle;
              const rectToRemove = shapeToRemove as Rectangle;
              return !(
                rectShape.x === rectToRemove.x &&
                rectShape.y === rectToRemove.y &&
                rectShape.width === rectToRemove.width &&
                rectShape.height === rectToRemove.height
              );
            case ShapeType.Ellipse:
              const ellipseShape = shape as Ellipse;
              const ellipseToRemove = shapeToRemove as Ellipse;
              return !(
                ellipseShape.centerX === ellipseToRemove.centerX &&
                ellipseShape.centerY === ellipseToRemove.centerY &&
                ellipseShape.radiusX === ellipseToRemove.radiusX &&
                ellipseShape.radiusY === ellipseToRemove.radiusY
              );
            case ShapeType.Pen:
              const penShape = shape as Pen;
              const penToRemove = shapeToRemove as Pen;
              return !(
                JSON.stringify(penShape.points) ===
                JSON.stringify(penToRemove.points)
              );
            case ShapeType.Line:
            case ShapeType.LineWithArrow:
              const lineShape = shape as Line | LineWithArrow;
              const lineToRemove = shapeToRemove as Line | LineWithArrow;
              return !(
                lineShape.startX === lineToRemove.startX &&
                lineShape.startY === lineToRemove.startY &&
                lineShape.endX === lineToRemove.endX &&
                lineShape.endY === lineToRemove.endY
              );
            case ShapeType.Diamond:
              const diamondShape = shape as Diamond;
              const diamondToRemove = shapeToRemove as Diamond;
              return !(
                diamondShape.centerX === diamondToRemove.centerX &&
                diamondShape.centerY === diamondToRemove.centerY &&
                diamondShape.width === diamondToRemove.width &&
                diamondShape.height === diamondToRemove.height
              );
            case ShapeType.Text:
              const textShape = shape as Text;
              const textToRemove = shapeToRemove as Text;
              return !(
                textShape.x === textToRemove.x &&
                textShape.y === textToRemove.y &&
                textShape.content === textToRemove.content &&
                textShape.fontSize === textToRemove.fontSize
              );
            default:
              return true;
          }
        });

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

    const handleMouseMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      const currentY = e.clientY;
      const ctx = ctxRef.current;
      if (!ctx) return;

      if (selectedTool === "text" && !isTypingRef.current) {
        // Show cursor preview for text tool
        ctx.save();
        renderShapes(ctx, existingShapes.current, strokeColor);
        ctx.fillStyle = strokeColor;
        ctx.fillRect(currentX, currentY - 15, 2, 20);
        ctx.restore();
        return;
      }

      if (selectedTool === "eraser") {
        // Find shape under cursor for highlighting
        const shape = findShapeAtPoint(currentX, currentY);

        // If we're dragging, add the shape to deletion set
        if (
          isDrawingRef.current &&
          shape &&
          !shapesToDelete.current.has(shape)
        ) {
          shapesToDelete.current.add(shape);
        }

        // Redraw all shapes with highlights for shapes to be deleted
        ctx.save();
        renderShapes(ctx, existingShapes.current, strokeColor);

        // Draw highlight for all shapes to be deleted
        shapesToDelete.current.forEach((shapeToHighlight) => {
          switch (shapeToHighlight.type) {
            case ShapeType.Rectangle:
              drawRect(
                ctx,
                shapeToHighlight.x,
                shapeToHighlight.y,
                shapeToHighlight.width,
                shapeToHighlight.height,
                highlightColor
              );
              break;
            case ShapeType.Ellipse:
              drawEllipse(
                ctx,
                shapeToHighlight.centerX,
                shapeToHighlight.centerY,
                shapeToHighlight.radiusX,
                shapeToHighlight.radiusY,
                highlightColor
              );
              break;
            case ShapeType.Pen:
              drawPen(ctx, shapeToHighlight.points, highlightColor);
              break;
            case ShapeType.Line:
              drawLine(
                ctx,
                shapeToHighlight.startX,
                shapeToHighlight.startY,
                shapeToHighlight.endX,
                shapeToHighlight.endY,
                highlightColor
              );
              break;
            case ShapeType.LineWithArrow:
              drawLineWithArrow(
                ctx,
                shapeToHighlight.startX,
                shapeToHighlight.startY,
                shapeToHighlight.endX,
                shapeToHighlight.endY,
                highlightColor
              );
              break;
            case ShapeType.Diamond:
              drawDiamond(
                ctx,
                shapeToHighlight.centerX,
                shapeToHighlight.centerY,
                shapeToHighlight.width,
                shapeToHighlight.height,
                highlightColor
              );
              break;
            case ShapeType.Text:
              ctx.font = `${shapeToHighlight.fontSize}px Arial`;
              ctx.fillStyle = highlightColor;
              ctx.fillText(
                shapeToHighlight.content,
                shapeToHighlight.x,
                shapeToHighlight.y
              );
              break;
          }
        });

        // Also highlight the currently hovered shape if it's not already marked for deletion
        if (shape && !shapesToDelete.current.has(shape)) {
          switch (shape.type) {
            case ShapeType.Rectangle:
              drawRect(
                ctx,
                shape.x,
                shape.y,
                shape.width,
                shape.height,
                "rgba(128, 128, 128, 0.3)"
              );
              break;
            case ShapeType.Ellipse:
              drawEllipse(
                ctx,
                shape.centerX,
                shape.centerY,
                shape.radiusX,
                shape.radiusY,
                "rgba(128, 128, 128, 0.3)"
              );
              break;
            case ShapeType.Pen:
              drawPen(ctx, shape.points, "rgba(128, 128, 128, 0.3)");
              break;
            case ShapeType.Line:
              drawLine(
                ctx,
                shape.startX,
                shape.startY,
                shape.endX,
                shape.endY,
                "rgba(128, 128, 128, 0.3)"
              );
              break;
            case ShapeType.LineWithArrow:
              drawLineWithArrow(
                ctx,
                shape.startX,
                shape.startY,
                shape.endX,
                shape.endY,
                "rgba(128, 128, 128, 0.3)"
              );
              break;
            case ShapeType.Diamond:
              drawDiamond(
                ctx,
                shape.centerX,
                shape.centerY,
                shape.width,
                shape.height,
                "rgba(128, 128, 128, 0.3)"
              );
              break;
            case ShapeType.Text:
              ctx.font = `${shape.fontSize}px Arial`;
              ctx.fillStyle = "rgba(128, 128, 128, 0.3)";
              ctx.fillText(shape.content, shape.x, shape.y);
              break;
          }
        }

        ctx.restore();
        return;
      }

      if (!isDrawingRef.current) return;

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

          penPointsRef.current.push({ x: currentX, y: currentY });
          drawPen(ctx, penPointsRef.current, strokeColor);
          break;
        case "line":
        case "lineWithArrow":
          const drawFunc =
            selectedTool === "line" ? drawLine : drawLineWithArrow;
          drawFunc(
            ctx,
            startXRef.current,
            startYRef.current,
            currentX,
            currentY,
            strokeColor
          );
          break;
        case "diamond":
          const diamondWidth = Math.abs(currentX - startXRef.current);
          const diamondHeight = Math.abs(currentY - startYRef.current);
          const diamondCenterX = (currentX + startXRef.current) / 2;
          const diamondCenterY = (currentY + startYRef.current) / 2;
          drawDiamond(
            ctx,
            diamondCenterX,
            diamondCenterY,
            diamondWidth,
            diamondHeight,
            strokeColor
          );
          break;
        case "text":
          // For text tool, we'll show a preview cursor
          ctx.fillStyle = strokeColor;
          ctx.fillRect(currentX, currentY - 15, 2, 20);
          break;
      }
      ctx.restore();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (selectedTool === "hand") return;

      if (selectedTool === "text") {
        if (isTypingRef.current) {
          // Finish current text if clicking elsewhere
          if (currentTextRef.current) {
            const shape: Shape = {
              type: ShapeType.Text,
              x: textPositionRef.current.x,
              y: textPositionRef.current.y,
              content: currentTextRef.current,
              fontSize: 16,
            };
            existingShapes.current.push(shape);
            if (onDrawShape) {
              onDrawShape(shape);
            }
          }
          isTypingRef.current = false;
          currentTextRef.current = "";
        } else {
          // Start new text
          isTypingRef.current = true;
          currentTextRef.current = "";
          textPositionRef.current = { x: e.clientX, y: e.clientY };
          const ctx = ctxRef.current;
          if (ctx) {
            renderShapes(ctx, existingShapes.current, strokeColor);
            // Show initial cursor
            ctx.fillStyle = strokeColor;
            ctx.fillRect(e.clientX, e.clientY - 15, 2, 20);
          }
        }
        return;
      }

      isDrawingRef.current = true;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;

      if (selectedTool === "pen") {
        penPointsRef.current = [{ x: e.clientX, y: e.clientY }];
      } else if (selectedTool === "eraser") {
        shapesToDelete.current.clear();
        const shape = findShapeAtPoint(e.clientX, e.clientY);
        if (shape) {
          shapesToDelete.current.add(shape);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      if (selectedTool === "eraser") {
        // Delete all collected shapes
        shapesToDelete.current.forEach((shape) => {
          if (onDeleteShape) {
            onDeleteShape(shape);
          }
        });

        existingShapes.current = existingShapes.current.filter(
          (shape) => !shapesToDelete.current.has(shape)
        );

        const ctx = ctxRef.current;
        if (ctx) {
          renderShapes(ctx, existingShapes.current, strokeColor);
        }

        shapesToDelete.current.clear();
        return;
      }

      const currentX = e.clientX;
      const currentY = e.clientY;
      const ctx = ctxRef.current;
      if (!ctx) return;

      let shape: Shape | null = null;

      switch (selectedTool) {
        case "rectangle":
          shape = {
            type: ShapeType.Rectangle,
            x: startXRef.current,
            y: startYRef.current,
            width: currentX - startXRef.current,
            height: currentY - startYRef.current,
          };
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

          shape = {
            type: ShapeType.Ellipse,
            centerX,
            centerY,
            radiusX,
            radiusY,
          };
          break;
        case "pen":
          if (!penPointsRef.current || penPointsRef.current.length < 2) return;

          shape = {
            type: ShapeType.Pen,
            points: [...penPointsRef.current],
          };
          penPointsRef.current = [];
          break;
        case "line":
          shape = {
            type: ShapeType.Line,
            startX: startXRef.current,
            startY: startYRef.current,
            endX: currentX,
            endY: currentY,
          };
          break;
        case "lineWithArrow":
          shape = {
            type: ShapeType.LineWithArrow,
            startX: startXRef.current,
            startY: startYRef.current,
            endX: currentX,
            endY: currentY,
          };
          break;
        case "diamond":
          const diamondWidth = Math.abs(currentX - startXRef.current);
          const diamondHeight = Math.abs(currentY - startYRef.current);
          const diamondCenterX = (currentX + startXRef.current) / 2;
          const diamondCenterY = (currentY + startYRef.current) / 2;

          shape = {
            type: ShapeType.Diamond,
            centerX: diamondCenterX,
            centerY: diamondCenterY,
            width: diamondWidth,
            height: diamondHeight,
          };
          break;
      }

      if (shape) {
        existingShapes.current.push(shape);
        if (onDrawShape) {
          onDrawShape(shape);
        }
        renderShapes(ctx, existingShapes.current, strokeColor);
      }
    };

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

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("resize", resizeCanvas);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (isTypingRef.current) {
          e.preventDefault();
          const ctx = ctxRef.current;
          if (!ctx) return;

          if (e.key === "Enter" || e.key === "Escape") {
            // Finish text on Enter or Escape
            if (currentTextRef.current) {
              const shape: Shape = {
                type: ShapeType.Text,
                x: textPositionRef.current.x,
                y: textPositionRef.current.y,
                content: currentTextRef.current,
                fontSize: 16,
              };
              existingShapes.current.push(shape);
              if (onDrawShape) {
                onDrawShape(shape);
              }
            }
            isTypingRef.current = false;
            currentTextRef.current = "";
            renderShapes(ctx, existingShapes.current, strokeColor);
            return;
          }

          if (e.key === "Backspace") {
            currentTextRef.current = currentTextRef.current.slice(0, -1);
          } else if (e.key.length === 1) {
            currentTextRef.current += e.key;
          }

          // Redraw with current text
          renderShapes(ctx, existingShapes.current, strokeColor);
          ctx.font = "16px Arial";
          ctx.fillStyle = strokeColor;
          ctx.fillText(
            currentTextRef.current,
            textPositionRef.current.x,
            textPositionRef.current.y
          );
          // Show cursor at end of text
          const textWidth = ctx.measureText(currentTextRef.current).width;
          ctx.fillRect(
            textPositionRef.current.x + textWidth,
            textPositionRef.current.y - 15,
            2,
            20
          );
          return;
        }

        // Handle tool shortcuts
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
          case "l":
            setSelectedTool("line");
            break;
          case "a":
            setSelectedTool("lineWithArrow");
            break;
          case "d":
            setSelectedTool("diamond");
            break;
          case "t":
            setSelectedTool("text");
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
