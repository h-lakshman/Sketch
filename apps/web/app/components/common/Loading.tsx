import { CircularProgress } from "@mui/material";

import { Box } from "@mui/material";

export default function Loading() {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        zIndex: 9999,
      }}
    >
      <CircularProgress />
    </Box>
  );
}
