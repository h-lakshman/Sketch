"use client";
import { Box, IconButton, Tooltip, Paper, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import RectangleOutlinedIcon from "@mui/icons-material/RectangleOutlined";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import CreateIcon from "@mui/icons-material/Create";
import PanToolIcon from "@mui/icons-material/PanTool";
import AutoFixNormalIcon from "@mui/icons-material/AutoFixNormal";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

export type ToolType = "rectangle" | "ellipse" | "pen" | "eraser" | "hand";

interface ToolBarProps {
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

const ToolbarContainer = styled(Paper)(({ theme }) => ({
  position: "fixed",
  left: "50%",
  transform: "translateX(-50%)",
  top: "16px",
  padding: "4px",
  display: "flex",
  gap: "2px",
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
}));

const ToolButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  width: "32px",
  height: "32px",
  borderRadius: "6px",
  backgroundColor: isSelected
    ? theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.08)"
    : "transparent",
  transition: "all 0.2s ease",
  padding: "6px",
  "&:hover": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? isSelected
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(255, 255, 255, 0.05)"
        : isSelected
          ? "rgba(0, 0, 0, 0.12)"
          : "rgba(0, 0, 0, 0.04)",
  },
  "& svg": {
    fontSize: "18px",
    color:
      theme.palette.mode === "dark"
        ? isSelected
          ? theme.palette.primary.light
          : "rgba(255, 255, 255, 0.7)"
        : isSelected
          ? theme.palette.primary.main
          : "rgba(0, 0, 0, 0.7)",
    transition: "all 0.2s ease",
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: "0 4px",
  borderColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.1)",
}));

const tools = [
  {
    type: "rectangle" as ToolType,
    icon: <RectangleOutlinedIcon />,
    tooltip: "Rectangle Tool (R)",
  },
  {
    type: "ellipse" as ToolType,
    icon: <CircleOutlinedIcon />,
    tooltip: "Ellipse Tool (E)",
  },
  {
    type: "pen" as ToolType,
    icon: <CreateIcon />,
    tooltip: "Pen Tool (P)",
  },
  {
    type: "eraser" as ToolType,
    icon: <AutoFixNormalIcon />,
    tooltip: "Eraser Tool (Del)",
  },
  {
    type: "hand" as ToolType,
    icon: <PanToolIcon />,
    tooltip: "Hand Tool (H)",
  },
];

export default function ToolBar({
  selectedTool,
  onToolSelect,
  isDarkMode,
  onThemeToggle,
}: ToolBarProps) {
  return (
    <ToolbarContainer elevation={3}>
      {tools.map((tool) => (
        <Tooltip
          key={tool.type}
          title={tool.tooltip}
          placement="bottom"
          enterDelay={500}
        >
          <ToolButton
            isSelected={selectedTool === tool.type}
            onClick={() => onToolSelect(tool.type)}
          >
            {tool.icon}
          </ToolButton>
        </Tooltip>
      ))}
      <StyledDivider orientation="vertical" flexItem />
      <Tooltip
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        placement="bottom"
        enterDelay={500}
      >
        <ToolButton onClick={onThemeToggle}>
          {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </ToolButton>
      </Tooltip>
    </ToolbarContainer>
  );
}
