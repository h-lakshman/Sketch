"use client";
import AuthLoading from "@/app/(auth)/loading";
import { BACKEND_URL, WEBSOCKET_URL } from "@/app/config";
import { useEffect, useRef, useState } from "react";
import BaseCanvas, {
  BaseCanvasHandle,
} from "@/app/components/canvas/BaseCanvas";
import { Shape } from "@/app/components/canvas/CanvasUtils";
import { getShapes } from "@/app/utils/api";

export default function Canvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [initialShapes, setInitialShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<BaseCanvasHandle>(null);

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

    // Setup WebSocket connection
    const newSocket = new WebSocket(
      WEBSOCKET_URL + `/?token=${localStorage.getItem("token")}`
    );

    newSocket.onopen = () => {
      console.log("Connected to websocket server");
      setSocket(newSocket);
      setIsConnected(true);
      newSocket.send(
        JSON.stringify({
          type: "join",
          roomId: roomId,
        })
      );
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
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

    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    newSocket.onclose = () => {
      console.log("Disconnected from websocket server");
      setIsConnected(false);
    };

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [roomId]);

  const handleDrawShape = (shape: Shape) => {
    if (socket && isConnected) {
      socket.send(
        JSON.stringify({
          type: "draw",
          roomId,
          shapeType: shape.type,
          shapeData: shape,
        })
      );
    }
  };

  if (loading) {
    return <AuthLoading />;
  }

  if (!socket || !isConnected) {
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
