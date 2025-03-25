"use client";
import { useState, useEffect } from "react";
import BaseCanvas from "../../components/canvas/BaseCanvas";
import { Button, CircularProgress } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import { useRouter, useParams } from "next/navigation";
import CollaborationModal from "../../components/modals/CollaborationModal";
import Canvas from "./Canvas";

export default function RoomCanvas() {
  const router = useRouter();
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [roomLink, setRoomLink] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const roomId = params?.roomId;
    if (roomId) {
      setRoomLink(`${window.location.origin}/canvas/${roomId}`);
      setIsLoading(false);
    }
  }, [params?.roomId]);

  const handleJoinRoom = () => {
    setIsModalOpen(true);
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
    setRoomLink(undefined);
    router.push("/canvas");
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
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
    );
  }

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
      <Canvas roomId={params?.roomId as string} />
      <CollaborationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStopSession={handleStopSession}
        isSessionActive={isSessionActive}
        roomLink={roomLink}
        isInRoom={true}
      />
    </div>
  );
}
