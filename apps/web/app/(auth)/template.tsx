"use client";

import { Box } from "@mui/material";
import { memo } from "react";

function AuthTemplate({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      {children}
    </Box>
  );
}

export default memo(AuthTemplate);
