"use client";
export enum ShapeType {
  Rectangle = "RECTANGLE",
  Ellipse = "ELLIPSE",
  Path = "PATH",
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

export interface Path {
  type: ShapeType.Path;
  points: { x: number; y: number }[];
}

export type Shape = Rectangle | Ellipse | Path;

export const drawRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  strokeColor: string = "#ffffff"
) => {
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
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
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();
};

export const drawPath = (
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  strokeColor: string = "#ffffff"
) => {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();
};

export const clearCanvas = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
      case ShapeType.Path:
        drawPath(ctx, shape.points, strokeColor);
        break;
    }
  });
};
