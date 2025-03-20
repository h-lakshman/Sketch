"use client";
export enum ShapeType {
  Rectangle = "RECTANGLE",
}

export interface Rectangle {
  type: ShapeType.Rectangle;
  x: number;
  y: number;
  width: number;
  height: number;
}
export type Shape = Rectangle;

export const drawRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  ctx.strokeRect(x, y, width, height);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
};

export const clearCanvas = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export const renderShapes = (
  ctx: CanvasRenderingContext2D,
  shapes: Shape[]
) => {
  clearCanvas(ctx);
  if (!shapes) {
    return;
  }
  shapes.forEach((shape) => {
    if (shape.type === ShapeType.Rectangle) {
      drawRect(ctx, shape.x, shape.y, shape.width, shape.height);
    }
  });
};
