"use client";
import AuthLoading from "@/app/(auth)/loading";
import { useEffect, useRef, useState } from "react";
import BaseCanvas, {
  BaseCanvasHandle,
} from "@/app/components/canvas/BaseCanvas";
import { Shape } from "@/app/components/canvas/CanvasUtils";
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
                };
              case "ELLIPSE":
                return {
                  type: "ELLIPSE" as const,
                  centerX: shape.ellipse.centerX,
                  centerY: shape.ellipse.centerY,
                  radiusX: shape.ellipse.radiusX,
                  radiusY: shape.ellipse.radiusY,
                };
              case "PEN":
                return {
                  type: "PEN" as const,
                  points: shape.pen.points,
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
      if (data.type === "draw") {
        // Add the new shape directly to canvas via ref
        if (canvasRef.current) {
          canvasRef.current.addShape(data.shapeData);
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
      />
    </div>
  );
}
