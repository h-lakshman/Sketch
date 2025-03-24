"use client";
import AuthLoading from "@/app/(auth)/loading";
import { useEffect, useRef, useState } from "react";
import BaseCanvas, {
  BaseCanvasHandle,
} from "@/app/components/canvas/BaseCanvas";
import { Shape, ShapeType } from "@/app/components/canvas/CanvasUtils";
import { getShapes } from "@/app/utils/api";
import WebSocketClient from "@/app/utils/WebSocketClient";

export default function Canvas({ roomId }: { roomId: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [initialShapes, setInitialShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<BaseCanvasHandle>(null);
  const wsClient = WebSocketClient.getInstance();

  useEffect(() => {
    const fetchShapes = async () => {
      try {
        const response = await getShapes(roomId);
        const shapes = response.shapes
          .map((shape: any) => {
            switch (shape.type) {
              case "RECTANGLE":
                return {
                  type: "RECTANGLE" as const,
                  x: shape.rectangle.x,
                  y: shape.rectangle.y,
                  width: shape.rectangle.width,
                  height: shape.rectangle.height,
                  color: shape.rectangle.color,
                  strokeWidth: shape.rectangle.strokeWidth,
                  strokeStyle: shape.rectangle.strokeStyle,
                };
              case "ELLIPSE":
                return {
                  type: "ELLIPSE" as const,
                  centerX: shape.ellipse.centerX,
                  centerY: shape.ellipse.centerY,
                  radiusX: shape.ellipse.radiusX,
                  radiusY: shape.ellipse.radiusY,
                  color: shape.ellipse.color,
                  strokeWidth: shape.ellipse.strokeWidth,
                  strokeStyle: shape.ellipse.strokeStyle,
                };
              case "PEN":
                return {
                  type: "PEN" as const,
                  points: shape.pen.points,
                  color: shape.pen.color,
                  strokeWidth: shape.pen.strokeWidth,
                  strokeStyle: shape.pen.strokeStyle,
                };
              case "LINE":
                return {
                  type: "LINE" as const,
                  startX: shape.line.startX,
                  startY: shape.line.startY,
                  endX: shape.line.endX,
                  endY: shape.line.endY,
                  color: shape.line.color,
                  strokeWidth: shape.line.strokeWidth,
                  strokeStyle: shape.line.strokeStyle,
                };
              case "LINE_WITH_ARROW":
                return {
                  type: "LINE_WITH_ARROW" as const,
                  startX: shape.lineWithArrow.startX,
                  startY: shape.lineWithArrow.startY,
                  endX: shape.lineWithArrow.endX,
                  endY: shape.lineWithArrow.endY,
                  color: shape.lineWithArrow.color,
                  strokeWidth: shape.lineWithArrow.strokeWidth,
                  strokeStyle: shape.lineWithArrow.strokeStyle,
                };
              case "DIAMOND":
                return {
                  type: "DIAMOND" as const,
                  centerX: shape.diamond.centerX,
                  centerY: shape.diamond.centerY,
                  width: shape.diamond.width,
                  height: shape.diamond.height,
                  color: shape.diamond.color,
                  strokeWidth: shape.diamond.strokeWidth,
                  strokeStyle: shape.diamond.strokeStyle,
                };
              case "TEXT":
                return {
                  type: "TEXT" as const,
                  x: shape.text.x,
                  y: shape.text.y,
                  content: shape.text.content,
                  fontSize: shape.text.fontSize,
                  color: shape.text.color,
                };
              default:
                console.warn("Unknown shape type:", shape.type);
                return null;
            }
          })
          .filter(Boolean);
        setInitialShapes(shapes);
      } catch (error) {
        console.error("Error fetching shapes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShapes();

    wsClient.connect();

    const messageHandler = (data: any) => {
      console.log("WebSocket message received:", data);

      if (data.type === "draw") {
        // Add the new shape directly to canvas via ref
        if (canvasRef.current) {
          let shapeObj: Shape | null = null;

          if (data.shapeData) {
            switch (data.shapeType) {
              case "RECTANGLE":
                shapeObj = {
                  type: ShapeType.Rectangle,
                  x: data.shapeData.x,
                  y: data.shapeData.y,
                  width: data.shapeData.width,
                  height: data.shapeData.height,
                  color: data.shapeData.color || "#ffffff",
                  strokeWidth: data.shapeData.strokeWidth,
                  strokeStyle: data.shapeData.strokeStyle,
                };
                break;
              case "ELLIPSE":
                shapeObj = {
                  type: ShapeType.Ellipse,
                  centerX: data.shapeData.centerX,
                  centerY: data.shapeData.centerY,
                  radiusX: data.shapeData.radiusX,
                  radiusY: data.shapeData.radiusY,
                  color: data.shapeData.color || "#ffffff",
                  strokeWidth: data.shapeData.strokeWidth,
                  strokeStyle: data.shapeData.strokeStyle,
                };
                break;
              case "PEN":
                shapeObj = {
                  type: ShapeType.Pen,
                  points: data.shapeData.points,
                  color: data.shapeData.color || "#ffffff",
                  strokeWidth: data.shapeData.strokeWidth,
                  strokeStyle: data.shapeData.strokeStyle,
                };
                break;
              case "LINE":
                shapeObj = {
                  type: ShapeType.Line,
                  startX: data.shapeData.startX,
                  startY: data.shapeData.startY,
                  endX: data.shapeData.endX,
                  endY: data.shapeData.endY,
                  color: data.shapeData.color || "#ffffff",
                  strokeWidth: data.shapeData.strokeWidth,
                  strokeStyle: data.shapeData.strokeStyle,
                };
                break;
              case "LINE_WITH_ARROW":
                shapeObj = {
                  type: ShapeType.LineWithArrow,
                  startX: data.shapeData.startX,
                  startY: data.shapeData.startY,
                  endX: data.shapeData.endX,
                  endY: data.shapeData.endY,
                  color: data.shapeData.color || "#ffffff",
                  strokeWidth: data.shapeData.strokeWidth,
                  strokeStyle: data.shapeData.strokeStyle,
                };
                break;
              case "DIAMOND":
                shapeObj = {
                  type: ShapeType.Diamond,
                  centerX: data.shapeData.centerX,
                  centerY: data.shapeData.centerY,
                  width: data.shapeData.width,
                  height: data.shapeData.height,
                  color: data.shapeData.color || "#ffffff",
                  strokeWidth: data.shapeData.strokeWidth,
                  strokeStyle: data.shapeData.strokeStyle,
                };
                break;
              case "TEXT":
                shapeObj = {
                  type: ShapeType.Text,
                  x: data.shapeData.x,
                  y: data.shapeData.y,
                  content: data.shapeData.content,
                  fontSize: data.shapeData.fontSize,
                  color: data.shapeData.color || "#ffffff",
                };
                break;
            }
          }

          if (shapeObj) {
            console.log("Adding shape to canvas:", shapeObj);
            canvasRef.current.addShape(shapeObj);
          }
        }
      } else if (data.type === "delete") {
        if (canvasRef.current && data.shapeData) {
          let shapeObj: Shape | null = null;

          switch (data.shapeType) {
            case "RECTANGLE":
              shapeObj = {
                type: ShapeType.Rectangle,
                x: data.shapeData.x,
                y: data.shapeData.y,
                width: data.shapeData.width,
                height: data.shapeData.height,
                color: data.color || "#ffffff",
                strokeWidth: data.shapeData.strokeWidth,
                strokeStyle: data.shapeData.strokeStyle,
              };
              break;
            case "ELLIPSE":
              shapeObj = {
                type: ShapeType.Ellipse,
                centerX: data.shapeData.centerX,
                centerY: data.shapeData.centerY,
                radiusX: data.shapeData.radiusX,
                radiusY: data.shapeData.radiusY,
                color: data.color || "#ffffff",
                strokeWidth: data.shapeData.strokeWidth,
                strokeStyle: data.shapeData.strokeStyle,
              };
              break;
            case "PEN":
              shapeObj = {
                type: ShapeType.Pen,
                points: data.shapeData.points,
                color: data.color || "#ffffff",
                strokeWidth: data.shapeData.strokeWidth,
                strokeStyle: data.shapeData.strokeStyle,
              };
              break;
            case "LINE":
              shapeObj = {
                type: ShapeType.Line,
                startX: data.shapeData.startX,
                startY: data.shapeData.startY,
                endX: data.shapeData.endX,
                endY: data.shapeData.endY,
                color: data.color || "#ffffff",
                strokeWidth: data.shapeData.strokeWidth,
                strokeStyle: data.shapeData.strokeStyle,
              };
              break;
            case "LINE_WITH_ARROW":
              shapeObj = {
                type: ShapeType.LineWithArrow,
                startX: data.shapeData.startX,
                startY: data.shapeData.startY,
                endX: data.shapeData.endX,
                endY: data.shapeData.endY,
                color: data.color || "#ffffff",
                strokeWidth: data.shapeData.strokeWidth,
                strokeStyle: data.shapeData.strokeStyle,
              };
              break;
            case "DIAMOND":
              shapeObj = {
                type: ShapeType.Diamond,
                centerX: data.shapeData.centerX,
                centerY: data.shapeData.centerY,
                width: data.shapeData.width,
                height: data.shapeData.height,
                color: data.color || "#ffffff",
                strokeWidth: data.shapeData.strokeWidth,
                strokeStyle: data.shapeData.strokeStyle,
              };
              break;
            case "TEXT":
              shapeObj = {
                type: ShapeType.Text,
                x: data.shapeData.x,
                y: data.shapeData.y,
                content: data.shapeData.content,
                fontSize: data.shapeData.fontSize,
                color: data.color || "#ffffff",
              };
              break;
          }

          if (shapeObj) {
            console.log("Removing shape from canvas:", shapeObj);
            canvasRef.current.removeShape(shapeObj);
          }
        }
      } else if (data.type === "success") {
        console.log("Success:", data.message);
      } else if (data.type === "error") {
        console.error("Error:", data.message);
      }
    };

    const connectHandler = () => {
      setIsConnected(true);
      wsClient.joinRoom(roomId);
    };

    const disconnectHandler = () => {
      setIsConnected(false);
    };

    const errorHandler = (error: any) => {
      console.error("WebSocket error:", error);
    };

    const unsubMessage = wsClient.onMessage(messageHandler);
    const unsubConnect = wsClient.onConnect(connectHandler);
    const unsubDisconnect = wsClient.onDisconnect(disconnectHandler);
    const unsubError = wsClient.onError(errorHandler);

    return () => {
      wsClient.leaveRoom(roomId);
      unsubMessage();
      unsubConnect();
      unsubDisconnect();
      unsubError();
    };
  }, [roomId]);

  const handleDrawShape = (shape: Shape) => {
    if (wsClient.isConnected()) {
      wsClient.sendDrawing(roomId, shape);
    }
  };

  const handleDeleteShape = (shape: Shape) => {
    if (wsClient.isConnected()) {
      wsClient.deleteShape(roomId, shape);
    }
  };

  if (loading) {
    return <AuthLoading />;
  }

  if (!isConnected) {
    return <AuthLoading />;
  }

  return (
    <div>
      <BaseCanvas
        ref={canvasRef}
        initialShapes={initialShapes}
        onDrawShape={handleDrawShape}
        onDeleteShape={handleDeleteShape}
      />
    </div>
  );
}
