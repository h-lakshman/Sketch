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
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 12,
                left: 12,
                display: "flex",
                gap: 0.5,
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
                width: "100%",
                height: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f8f9fa",
                borderRadius: 1,
                mt: 3,
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "linear-gradient(45deg, #f8f9fa 25%, transparent 25%, transparent 75%, #f8f9fa 75%, #f8f9fa) 0 0, linear-gradient(45deg, #f8f9fa 25%, transparent 25%, transparent 75%, #f8f9fa 75%, #f8f9fa) 20px 20px",
                  backgroundSize: "40px 40px",
                  opacity: 0.4,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <AutoFixHighIcon
                  sx={{ fontSize: 48, color: "text.secondary" }}
                />
                <Typography
                  variant="h5"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Your canvas awaits
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
