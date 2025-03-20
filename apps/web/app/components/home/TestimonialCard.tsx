import { Avatar, Card, CardContent, Box, Typography } from "@mui/material";

interface TestimonialCardProps {
  avatar: string;
  name: string;
  role: string;
  content: string;
}

export default function TestimonialCard({
  avatar,
  name,
  role,
  content,
}: TestimonialCardProps) {
  return (
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
            {avatar}
          </Avatar>
          <Box sx={{ ml: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {role}
            </Typography>
          </Box>
        </Box>
        <Typography color="text.secondary">"{content}"</Typography>
      </CardContent>
    </Card>
  );
}
