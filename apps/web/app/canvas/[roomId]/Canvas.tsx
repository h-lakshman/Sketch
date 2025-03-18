"use client";
import AuthLoading from "@/app/(auth)/loading";
import { WEBSOCKET_URL } from "@/app/config";
import { useEffect, useState } from "react";
import CanvasLogic from "./CanvasLogic";

export default function Canvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = new WebSocket(
      WEBSOCKET_URL + `?token=${localStorage.getItem("token")}`
    );

    newSocket.onopen = () => {
      console.log("Connected to websocket server");
      setSocket(newSocket);
      setIsConnected(true);
    };

    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    newSocket.onclose = () => {
      console.log("Disconnected from websocket server");
      setIsConnected(false);
    };
  }, []);

  if (!socket) {
    return <AuthLoading />;
  }
  if (!isConnected) {
    return <AuthLoading />;
  }

  return <CanvasLogic roomId={roomId} socket={socket} />;
}
