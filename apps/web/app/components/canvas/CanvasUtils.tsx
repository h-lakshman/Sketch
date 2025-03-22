"use client";
export enum ShapeType {
  Rectangle = "RECTANGLE",
  Ellipse = "ELLIPSE",
  Pen = "PEN",
  Line = "LINE",
  LineWithArrow = "LINE_WITH_ARROW",
  Diamond = "DIAMOND",
  Text = "TEXT",
}

export interface Rectangle {
  type: ShapeType.Rectangle;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ellipse {
  type: ShapeType.Ellipse;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}

export interface Pen {
  type: ShapeType.Pen;
  points: { x: number; y: number }[];
}

export interface Line {
  type: ShapeType.Line;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface LineWithArrow {
  type: ShapeType.LineWithArrow;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface Diamond {
  type: ShapeType.Diamond;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export interface Text {
  type: ShapeType.Text;
  x: number;
  y: number;
  content: string;
  fontSize: number;
}

export type Shape =
  | Rectangle
  | Ellipse
  | Pen
  | Line
  | LineWithArrow
  | Diamond
  | Text;

export const drawRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  strokeColor: string = "#ffffff"
) => {
  ctx.strokeStyle = strokeColor;
  ctx.strokeRect(x, y, width, height);
};

export const drawEllipse = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  strokeColor: string = "#ffffff"
) => {
  ctx.beginPath();
  ctx.strokeStyle = strokeColor;
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.stroke();
};

export const drawPen = (
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  strokeColor: string = "#ffffff"
) => {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.strokeStyle = strokeColor;
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
};

export const clearCanvas = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export const drawLine = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  strokeColor: string = "#ffffff"
) => {
  ctx.beginPath();
  ctx.strokeStyle = strokeColor;
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
};

export const drawLineWithArrow = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  strokeColor: string = "#ffffff"
) => {
  // Draw the main line
  drawLine(ctx, startX, startY, endX, endY, strokeColor);

  // Calculate arrow head
  const headLength = 15;
  const angle = Math.atan2(endY - startY, endX - startX);
  const arrowAngle = Math.PI / 6; // 30 degrees

  // Draw arrow head
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - arrowAngle),
    endY - headLength * Math.sin(angle - arrowAngle)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle + arrowAngle),
    endY - headLength * Math.sin(angle + arrowAngle)
  );
  ctx.strokeStyle = strokeColor;
  ctx.stroke();
};

export const drawDiamond = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  strokeColor: string = "#ffffff"
) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  ctx.beginPath();
  ctx.strokeStyle = strokeColor;
  ctx.moveTo(centerX, centerY - halfHeight); // Top point
  ctx.lineTo(centerX + halfWidth, centerY); // Right point
  ctx.lineTo(centerX, centerY + halfHeight); // Bottom point
  ctx.lineTo(centerX - halfWidth, centerY); // Left point
  ctx.closePath();
  ctx.stroke();
};

export const drawText = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  content: string,
  fontSize: number = 16,
  strokeColor: string = "#ffffff"
) => {
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = strokeColor;
  ctx.fillText(content, x, y);
};

export const renderShapes = (
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  strokeColor: string = "#ffffff"
) => {
  clearCanvas(ctx);
  if (!shapes) return;

  shapes.forEach((shape) => {
    switch (shape.type) {
      case ShapeType.Rectangle:
        drawRect(ctx, shape.x, shape.y, shape.width, shape.height, strokeColor);
        break;
      case ShapeType.Ellipse:
        drawEllipse(
          ctx,
          shape.centerX,
          shape.centerY,
          shape.radiusX,
          shape.radiusY,
          strokeColor
        );
        break;
      case ShapeType.Pen:
        drawPen(ctx, shape.points, strokeColor);
        break;
      case ShapeType.Line:
        drawLine(
          ctx,
          shape.startX,
          shape.startY,
          shape.endX,
          shape.endY,
          strokeColor
        );
        break;
      case ShapeType.LineWithArrow:
        drawLineWithArrow(
          ctx,
          shape.startX,
          shape.startY,
          shape.endX,
          shape.endY,
          strokeColor
        );
        break;
      case ShapeType.Diamond:
        drawDiamond(
          ctx,
          shape.centerX,
          shape.centerY,
          shape.width,
          shape.height,
          strokeColor
        );
        break;
      case ShapeType.Text:
        drawText(
          ctx,
          shape.x,
          shape.y,
          shape.content,
          shape.fontSize,
          strokeColor
        );
        break;
    }
  });
};
