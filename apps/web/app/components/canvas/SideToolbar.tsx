"use client";
import React from "react";
import {
  Box,
  Paper,
  Slider,
  Typography,
  IconButton,
  Tooltip,
  styled,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

interface SideToolbarProps {
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  strokeStyle: string;
  onStrokeStyleChange: (style: string) => void;
  showFontSize?: boolean;
}

const ToolbarContainer = styled(Paper)(({ theme }) => ({
  position: "fixed",
  left: "16px",
  top: "50%",
  transform: "translateY(-50%)",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(30, 30, 30, 0.9)"
      : "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(8px)",
  borderRadius: "8px",
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 4px 6px rgba(0, 0, 0, 0.3)"
      : "0 4px 6px rgba(0, 0, 0, 0.1)",
  border: `1px solid ${
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(255, 255, 255, 0.2)"
  }`,
  zIndex: 1000,
  width: "200px",
}));

const ColorButton = styled(IconButton)(({ theme }) => ({
  width: "24px",
  height: "24px",
  padding: 0,
  border: "2px solid white",
  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
}));

const colors = [
  "#000000",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
];

const strokeStyles = [
  { value: "SOLID", label: "Solid" },
  { value: "DASHED", label: "Dashed" },
  { value: "DOTTED", label: "Dotted" },
];

export default function SideToolbar({
  strokeWidth,
  onStrokeWidthChange,
  strokeColor,
  onStrokeColorChange,
  fontSize,
  onFontSizeChange,
  strokeStyle,
  onStrokeStyleChange,
  showFontSize = false,
}: SideToolbarProps) {
  return (
    <ToolbarContainer elevation={3}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Stroke Style
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={strokeStyle}
            onChange={(e) => onStrokeStyleChange(e.target.value)}
            sx={{ backgroundColor: "background.paper" }}
          >
            {strokeStyles.map((style) => (
              <MenuItem key={style.value} value={style.value}>
                {style.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Stroke Width
        </Typography>
        <Slider
          value={strokeWidth}
          onChange={(_, value) => onStrokeWidthChange(value as number)}
          min={1}
          max={20}
          step={1}
          valueLabelDisplay="auto"
          sx={{ width: "100%" }}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Colors
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
          }}
        >
          {colors.map((color) => (
            <Tooltip key={color} title={color} placement="top">
              <ColorButton
                onClick={() => onStrokeColorChange(color)}
                sx={{
                  backgroundColor: color,
                  "&:hover": {
                    backgroundColor: color,
                  },
                  outline: strokeColor === color ? "2px solid #2196f3" : "none",
                  outlineOffset: "2px",
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      {showFontSize && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Font Size
          </Typography>
          <Slider
            value={fontSize}
            onChange={(_, value) => onFontSizeChange(value as number)}
            min={12}
            max={72}
            step={2}
            defaultValue={16}
            valueLabelDisplay="auto"
            sx={{ width: "100%" }}
          />
        </Box>
      )}
    </ToolbarContainer>
  );
}
