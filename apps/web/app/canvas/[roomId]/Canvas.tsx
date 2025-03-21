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
        const shapes = response.shapes.map((shape: any) => ({
          type: "RECTANGLE" as const,
          x: shape.rectangle.x,
          y: shape.rectangle.y,
          width: shape.rectangle.width,
          height: shape.rectangle.height,
        }));
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

    // Register event handlers
    const unsubMessage = wsClient.onMessage(messageHandler);
    const unsubConnect = wsClient.onConnect(connectHandler);
    const unsubDisconnect = wsClient.onDisconnect(disconnectHandler);
    const unsubError = wsClient.onError(errorHandler);

    // Cleanup function
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
