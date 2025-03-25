import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  TextField,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import LinkIcon from "@mui/icons-material/Link";
import { useRouter } from "next/navigation";

interface CollaborationModalProps {
  open: boolean;
  onClose: () => void;
  onStartSession?: (roomName: string) => Promise<void>;
  onStopSession: () => void;
  isSessionActive: boolean;
  roomLink?: string;
  isInRoom?: boolean;
  isLoading?: boolean;
}

export default function CollaborationModal({
  open,
  onClose,
  onStartSession,
  onStopSession,
  isSessionActive,
  roomLink,
  isInRoom = false,
}: CollaborationModalProps) {
  const [copied, setCopied] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCopyLink = async () => {
    if (roomLink) {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartClick = async () => {
    if (!roomName.trim()) {
      setError("Please enter a room name");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      if (onStartSession) await onStartSession(roomName.trim());
    } catch (error) {
      setError("Failed to create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToRoom = () => {
    const roomId = roomLink?.split("/").pop();
    if (roomId) {
      router.push(`/canvas/${roomId}`);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Collaborate on Drawing
        </Typography>
        <IconButton onClick={onClose} size="small" disabled={isLoading}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
          Invite people to collaborate on your drawing in real-time.
        </Typography>

        {!isSessionActive && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Enter a name for your room:
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g., Project Brainstorm"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                if (error) setError("");
              }}
              error={!!error}
              helperText={error}
              sx={{ mb: 2 }}
              disabled={isLoading}
            />
          </Box>
        )}

        {isSessionActive && roomLink && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Share this link with collaborators:
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                value={roomLink}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <LinkIcon fontSize="small" sx={{ mr: 1, color: "#666" }} />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={handleCopyLink}
                startIcon={<ContentCopyIcon fontSize="small" />}
                sx={{
                  minWidth: "120px",
                  borderColor: copied ? "success.main" : "inherit",
                  color: copied ? "success.main" : "inherit",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          display: "flex",
          gap: 2,
          justifyContent: isSessionActive ? "space-between" : "flex-end",
        }}
      >
        {!isSessionActive ? (
          <Button
            variant="contained"
            onClick={handleStartClick}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PlayArrowIcon fontSize="small" />
              )
            }
            disabled={isLoading}
            sx={{
              backgroundColor: "#000",
              "&:hover": {
                backgroundColor: "#222",
              },
              minWidth: "150px",
            }}
          >
            {isLoading ? "Creating..." : "Start Session"}
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              color="error"
              onClick={onStopSession}
              startIcon={<StopIcon fontSize="small" />}
            >
              Stop Session
            </Button>
            {!isInRoom && (
              <Button
                variant="contained"
                onClick={handleGoToRoom}
                startIcon={<PlayArrowIcon fontSize="small" />}
                sx={{
                  backgroundColor: "#000",
                  "&:hover": {
                    backgroundColor: "#222",
                  },
                }}
              >
                Go to Room
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
