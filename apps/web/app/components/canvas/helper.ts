// Canvas utility functions
import { Shape, ShapeType } from "./CanvasUtils";

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
export const findShapeAtPoint = (
  shapes: Shape[],
  x: number,
  y: number,
  threshold: number = 5,
  ctx: CanvasRenderingContext2D | null = null
): Shape | null => {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];

    switch (shape.type) {
      case ShapeType.Rectangle: {
        const rect = shape;
        // Check each edge of the rectangle
        const edges = [
          { x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y }, // Top
          {
            x1: rect.x + rect.width,
            y1: rect.y,
            x2: rect.x + rect.width,
            y2: rect.y + rect.height,
          }, // Right
          {
            x1: rect.x,
            y1: rect.y + rect.height,
            x2: rect.x + rect.width,
            y2: rect.y + rect.height,
          }, // Bottom
          { x1: rect.x, y1: rect.y, x2: rect.x, y2: rect.y + rect.height }, // Left
        ];

        for (const edge of edges) {
          if (
            distanceToLineSegment(edge.x1, edge.y1, edge.x2, edge.y2, x, y) <=
            threshold
          ) {
            return shape;
          }
        }
        break;
      }

      case ShapeType.Ellipse: {
        const ellipse = shape;
        const normalizedX = (x - ellipse.centerX) / ellipse.radiusX;
        const normalizedY = (y - ellipse.centerY) / ellipse.radiusY;
        const distanceFromCircumference = Math.abs(
          normalizedX * normalizedX + normalizedY * normalizedY - 1
        );
        if (distanceFromCircumference <= 0.15) {
          return shape;
        }
        break;
      }

      case ShapeType.Pen: {
        const pen = shape;
        for (let j = 1; j < pen.points.length; j++) {
          const p1 = pen.points[j - 1];
          const p2 = pen.points[j];
          if (distanceToLineSegment(p1.x, p1.y, p2.x, p2.y, x, y) < threshold) {
            return shape;
          }
        }
        break;
      }

      case ShapeType.Line:
      case ShapeType.LineWithArrow: {
        const line = shape;
        if (
          distanceToLineSegment(
            line.startX,
            line.startY,
            line.endX,
            line.endY,
            x,
            y
          ) <= threshold
        ) {
          return shape;
        }
        break;
      }

      case ShapeType.Diamond: {
        const diamond = shape;
        const halfWidth = diamond.width / 2;
        const halfHeight = diamond.height / 2;
        const points = [
          { x: diamond.centerX, y: diamond.centerY - halfHeight },
          { x: diamond.centerX + halfWidth, y: diamond.centerY },
          { x: diamond.centerX, y: diamond.centerY + halfHeight },
          { x: diamond.centerX - halfWidth, y: diamond.centerY },
        ];

        for (let j = 0; j < points.length; j++) {
          const p1 = points[j];
          const p2 = points[(j + 1) % points.length];
          if (
            distanceToLineSegment(p1.x, p1.y, p2.x, p2.y, x, y) <= threshold
          ) {
            return shape;
          }
        }
        break;
      }

      case ShapeType.Text: {
        const text = shape;
        if (ctx) {
          const textHeight = text.fontSize;
          ctx.font = `${text.fontSize}px Arial`;
          const textWidth = ctx.measureText(text.content).width;
          if (
            x >= text.x &&
            x <= text.x + textWidth &&
            y >= text.y - textHeight &&
            y <= text.y
          ) {
            return shape;
          }
        }
        break;
      }
    }
  }
  return null;
};

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
