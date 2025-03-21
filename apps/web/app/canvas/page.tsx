"use client";
import { useState, useRef } from "react";
import BaseCanvas, { BaseCanvasHandle } from "../components/canvas/BaseCanvas";
import { Button } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import { useRouter } from "next/navigation";
import CollaborationModal from "../components/modals/CollaborationModal";
import { createRoom } from "../utils/api";
import { Shape } from "../components/canvas/CanvasUtils";

export default function Canvas() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [roomLink, setRoomLink] = useState<string>();
  const [roomId, setRoomId] = useState<string>();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const canvasRef = useRef<BaseCanvasHandle>(null);

  const handleJoinRoom = () => {
    setIsModalOpen(true);
  };

  const handleStartSession = async (roomName: string) => {
    try {
      const response = await createRoom(roomName);
      const newRoomId = response.roomId;
      setRoomId(newRoomId);

      const fullLink = `${window.location.origin}/canvas/${newRoomId}`;
      setRoomLink(fullLink);
      setIsSessionActive(true);
    } catch (error) {
      console.error("Failed to create room:", error);
      return;
    }
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
    setRoomLink(undefined);
    setRoomId(undefined);
    router.push("/canvas");
    setIsModalOpen(false);
  };

  const handleDrawShape = (shape: Shape) => {
    setShapes((prevShapes) => [...prevShapes, shape]);
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleJoinRoom}
          startIcon={<GroupIcon fontSize="small" />}
          sx={{
            fontWeight: 600,
            borderRadius: 1.5,
            padding: "10px 24px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            backgroundColor: "#000000",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.15)",
              backgroundColor: "#000000",
            },
            "&:active": {
              transform: "translateY(0)",
            },
          }}
        >
          Live Collaboration
        </Button>
      </div>
      <BaseCanvas
        ref={canvasRef}
        initialShapes={shapes}
        onDrawShape={handleDrawShape}
      />
      <CollaborationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartSession={handleStartSession}
        onStopSession={handleStopSession}
        isSessionActive={isSessionActive}
        roomLink={roomLink}
        isInRoom={false}
      />
    </div>
  );
}
