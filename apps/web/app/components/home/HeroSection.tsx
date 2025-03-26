import { Box, Button, Container, Grid, Paper, Typography } from "@mui/material";
import Link from "next/link";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

export default function HeroSection() {
  return (
    <Container maxWidth="lg" id="hero">
      <Grid
        container
        spacing={4}
        alignItems="center"
        sx={{
          minHeight: "100vh",
          pt: { xs: 12, md: 8 },
        }}
      >
        <Grid item xs={12} md={6}>
          <Box sx={{ maxWidth: 600 }}>
            <Typography
              variant="h1"
              gutterBottom
              sx={{
                background: "linear-gradient(45deg, #000 30%, #666 90%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Create, Collaborate, and Share Your Ideas
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 4, fontWeight: 400 }}
            >
              Sketch is a virtual whiteboard for all your diagramming needs.
              Create flowcharts, wireframes, and more with our intuitive drawing
              tools.
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Link href="/signup" style={{ textDecoration: "none" }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    color: "white",
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Get Started
                </Button>
              </Link>
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
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: "background.paper",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                bgcolor: "#EEF1FF",
                borderRadius: "16px",
                border: "1px solid rgba(0,0,0,0.05)",
                width: { xs: "280px", md: "340px" },
                height: { xs: "280px", md: "340px" },
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  display: "flex",
                  gap: 0.8,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: "#ff5f57",
                  }}
                />
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: "#ffbd2e",
                  }}
                />
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: "#28c941",
                  }}
                />
              </Box>

              <Box
                sx={{
                  width: "80%",
                  height: "80%",
                  border: "1px dashed rgba(0,0,0,0.15)",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  padding: "20px",
                }}
              >
                <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    style={{
                      color: "#222",
                    }}
                  >
                    <path
                      fill="currentColor"
                      d="M20.71,4.04C21.1,3.65 21.1,3 20.71,2.63L18.37,0.29C18,-0.1 17.35,-0.1 16.96,0.29L15,2.25L18.75,6L20.71,4.04M14.06,3.19L3,14.25V18H6.75L17.81,6.94L14.06,3.19Z"
                    />
                  </svg>
                </Box>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ fontWeight: 400 }}
                >
                  Your canvas awaits
                </Typography>
                <Box
                  sx={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "#ff5f57",
                    position: "absolute",
                    bottom: "20px",
                    right: "48%",
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
