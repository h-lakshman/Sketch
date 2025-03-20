import { Box, Card, CardContent, Typography } from "@mui/material";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        backgroundColor: "transparent",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
        },
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: "50%",
            backgroundColor: "background.default",
            color: "primary.main",
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="h3">
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </CardContent>
    </Card>
  );
}
