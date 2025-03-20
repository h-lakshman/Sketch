import { Box, Container, Typography } from "@mui/material";
import CtaSectionButtons from "./CtaSectionButtons";

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
          <CtaSectionButtons />
        </Box>
      </Container>
    </Box>
  );
}
