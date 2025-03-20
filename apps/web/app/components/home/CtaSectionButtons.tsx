"use client";

import { Box, Button } from "@mui/material";
import Link from "next/link";

export default function CtaSectionButtons() {
  return (
    <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
      <Button
        variant="contained"
        size="large"
        sx={{
          color: "white",
          px: 4,
          py: 1.5,
        }}
        component={Link}
        href="/signup"
      >
        Get Started for Free
      </Button>
      <Button
        variant="outlined"
        size="large"
        sx={{
          px: 4,
          py: 1.5,
        }}
      >
        Learn More
      </Button>
    </Box>
  );
}
