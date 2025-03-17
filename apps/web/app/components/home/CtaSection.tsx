"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import Link from "next/link";

export default function CtaSection() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: "center",
            maxWidth: 800,
            mx: "auto",
          }}
        >
          <Typography variant="h2" gutterBottom>
            Ready to bring your ideas to life?
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            Join thousands of creators who use Sketch to visualize their
            thoughts and collaborate with others.
          </Typography>
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
        </Box>
      </Container>
    </Box>
  );
}
