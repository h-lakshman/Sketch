"use client";
import { useState, useRef, useEffect } from "react";
import BaseCanvas, { BaseCanvasHandle } from "../components/canvas/BaseCanvas";
import { Button, CircularProgress } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import { useRouter } from "next/navigation";
import CollaborationModal from "../components/modals/CollaborationModal";
import { createRoom } from "../utils/api";
import { Shape } from "../components/canvas/CanvasUtils";

const LOCAL_STORAGE_KEY = "canvas_shapes";

export default function Canvas() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [roomLink, setRoomLink] = useState<string>();
  const [roomId, setRoomId] = useState<string>();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const canvasRef = useRef<BaseCanvasHandle>(null);
  const shapesRef = useRef<Shape[]>([]);

  // Load shapes from localStorage on initial render
  useEffect(() => {
    try {
      const savedShapes = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedShapes) {
        const parsedShapes = JSON.parse(savedShapes);
        setShapes(parsedShapes);
        shapesRef.current = parsedShapes;
      }
    } catch (error) {
      console.error("Failed to load shapes from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToLocalStorage = (newShapes: Shape[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newShapes));
    } catch (error) {
      console.error("Failed to save shapes to localStorage:", error);
    }
  };

  const handleJoinRoom = () => {
    setIsModalOpen(true);
  };

  const handleStartSession = async (roomName: string) => {
    setIsCreatingRoom(true);
    try {
      const response = await createRoom(roomName);
      const newRoomId = response.roomId;
      setRoomId(newRoomId);

      const fullLink = `${window.location.origin}/canvas/${newRoomId}`;
      setRoomLink(fullLink);
      setIsSessionActive(true);
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreatingRoom(false);
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
    const newShapes = [...shapesRef.current, shape];
    shapesRef.current = newShapes;
    setShapes(newShapes);
    saveToLocalStorage(newShapes);
  };

  const handleDeleteShape = (shape: Shape) => {
    const newShapes = shapesRef.current.filter((s) => s !== shape);
    shapesRef.current = newShapes;
    setShapes(newShapes);
    saveToLocalStorage(newShapes);
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
          disabled={isCreatingRoom}
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
          {isCreatingRoom ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Live Collaboration"
          )}
        </Button>
      </div>
      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </div>
      ) : (
        <BaseCanvas
          ref={canvasRef}
          initialShapes={shapes}
          onDrawShape={handleDrawShape}
          onDeleteShape={handleDeleteShape}
        />
      )}
      <CollaborationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartSession={handleStartSession}
        onStopSession={handleStopSession}
        isSessionActive={isSessionActive}
        roomLink={roomLink}
        isInRoom={false}
        isLoading={isCreatingRoom}
      />
    </div>
  );
}
