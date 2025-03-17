"use client";

import { Box, CircularProgress } from "@mui/material";

export default function AuthLoading() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
      }}
    >
      
      <CircularProgress />
    </Box>
  );
}
