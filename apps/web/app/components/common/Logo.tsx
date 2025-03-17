"use client";

import { Box, Typography } from "@mui/material";
import Link from "next/link";
import CreateIcon from "@mui/icons-material/Create";

export default function Logo({ color = "black" }: { color?: string }) {
  return (
    <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CreateIcon sx={{ fontSize: 28, transform: "rotate(-45deg)" }} />
        <Typography
          variant="h6"
          component="span"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: color,
          }}
        >
          Sketch
        </Typography>
      </Box>
    </Link>
  );
}
