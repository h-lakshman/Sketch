// Canvas utility functions
import { Shape, ShapeType, Diamond } from "./CanvasUtils";

// Calculate distance between a point and a line segment
export const distanceToLineSegment = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  px: number,
  py: number
): number => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

// Setup canvas context with default settings
export const setupCanvasContext = (
  ctx: CanvasRenderingContext2D,
  strokeColor: string,
  lineWidth: number = 2
) => {
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
};

// Find shape at given coordinates
export function findShapeAtPoint(
  shapes: Shape[],
  x: number,
  y: number
): Shape | null {
  // Iterate through shapes in reverse order to check the topmost shape first
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    switch (shape.type) {
      case ShapeType.Rectangle:
        if (
          x >= shape.x &&
          x <= shape.x + shape.width &&
          y >= shape.y &&
          y <= shape.y + shape.height
        ) {
          return shape;
        }
        break;
      case ShapeType.Ellipse:
        const normalizedX = (x - shape.centerX) / shape.radiusX;
        const normalizedY = (y - shape.centerY) / shape.radiusY;
        if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) {
          return shape;
        }
        break;
      case ShapeType.Pen:
        for (let j = 0; j < shape.points.length - 1; j++) {
          const point1 = shape.points[j];
          const point2 = shape.points[j + 1];
          if (
            isPointNearLine(
              x,
              y,
              point1.x,
              point1.y,
              point2.x,
              point2.y,
              shape.strokeWidth
            )
          ) {
            return shape;
          }
        }
        break;
      case ShapeType.Line:
      case ShapeType.LineWithArrow:
        if (
          isPointNearLine(
            x,
            y,
            shape.startX,
            shape.startY,
            shape.endX,
            shape.endY,
            shape.strokeWidth
          )
        ) {
          return shape;
        }
        break;
      case ShapeType.Diamond:
        const points = getDiamondPoints(shape);
        if (isPointInPolygon(x, y, points)) {
          return shape;
        }
        break;
      case ShapeType.Text:
        // Create a bounding box for text based on font size
        const textHeight = shape.fontSize;
        const ctx = document.createElement("canvas").getContext("2d");
        if (ctx) {
          ctx.font = `${shape.fontSize}px Arial`;
          const textWidth = ctx.measureText(shape.content).width;
          if (
            x >= shape.x &&
            x <= shape.x + textWidth &&
            y >= shape.y - textHeight &&
            y <= shape.y
          ) {
            return shape;
          }
        }
        break;
    }
  }
  return null;
}

function isPointNearLine(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold: number
): boolean {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;

  if (len_sq !== 0) {
    param = dot / len_sq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy) <= threshold;
}

function getDiamondPoints(shape: Diamond): { x: number; y: number }[] {
  return [
    { x: shape.centerX, y: shape.centerY - shape.height / 2 }, // Top
    { x: shape.centerX + shape.width / 2, y: shape.centerY }, // Right
    { x: shape.centerX, y: shape.centerY + shape.height / 2 }, // Bottom
    { x: shape.centerX - shape.width / 2, y: shape.centerY }, // Left
  ];
}

function isPointInPolygon(
  x: number,
  y: number,
  points: { x: number; y: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Compare two shapes for equality
export const areShapesEqual = (shape1: Shape, shape2: Shape): boolean => {
  if (shape1.type !== shape2.type) return false;

  switch (shape1.type) {
    case ShapeType.Rectangle: {
      const rect1 = shape1;
      const rect2 = shape2 as typeof rect1;
      return (
        rect1.x === rect2.x &&
        rect1.y === rect2.y &&
        rect1.width === rect2.width &&
        rect1.height === rect2.height
      );
    }

    case ShapeType.Ellipse: {
      const ellipse1 = shape1;
      const ellipse2 = shape2 as typeof ellipse1;
      return (
        ellipse1.centerX === ellipse2.centerX &&
        ellipse1.centerY === ellipse2.centerY &&
        ellipse1.radiusX === ellipse2.radiusX &&
        ellipse1.radiusY === ellipse2.radiusY
      );
    }

    case ShapeType.Pen: {
      const pen1 = shape1;
      const pen2 = shape2 as typeof pen1;
      return JSON.stringify(pen1.points) === JSON.stringify(pen2.points);
    }

    case ShapeType.Line:
    case ShapeType.LineWithArrow: {
      const line1 = shape1;
      const line2 = shape2 as typeof line1;
      return (
        line1.startX === line2.startX &&
        line1.startY === line2.startY &&
        line1.endX === line2.endX &&
        line1.endY === line2.endY
      );
    }

    case ShapeType.Diamond: {
      const diamond1 = shape1;
      const diamond2 = shape2 as typeof diamond1;
      return (
        diamond1.centerX === diamond2.centerX &&
        diamond1.centerY === diamond2.centerY &&
        diamond1.width === diamond2.width &&
        diamond1.height === diamond2.height
      );
    }

    case ShapeType.Text: {
      const text1 = shape1;
      const text2 = shape2 as typeof text1;
      return (
        text1.x === text2.x &&
        text1.y === text2.y &&
        text1.content === text2.content &&
        text1.fontSize === text2.fontSize
      );
    }

    default:
      return false;
  }
};
