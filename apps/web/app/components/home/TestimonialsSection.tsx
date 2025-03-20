import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
} from "@mui/material";

interface Testimonial {
  avatar: string;
  name: string;
  role: string;
  content: string;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <Box
      id="testimonials"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: "background.default",
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          align="center"
          gutterBottom
          sx={{
            mb: 1,
          }}
        >
          Loved by Creators
        </Typography>
        <Typography
          variant="h5"
          align="center"
          color="text.secondary"
          sx={{ mb: 8, maxWidth: 600, mx: "auto" }}
        >
          See what our users are saying about Sketch
        </Typography>
        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  p: 2,
                  backgroundColor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: "grey.200",
                        color: "text.primary",
                        fontWeight: 600,
                      }}
                    >
                      {testimonial.avatar}
                    </Avatar>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography color="text.secondary">
                    "{testimonial.content}"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
