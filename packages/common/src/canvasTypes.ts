export enum ShapeType {
  RECTANGLE = "RECTANGLE",
}

export interface RectangleData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Rectangle {
  type: ShapeType.RECTANGLE;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ShapeData = RectangleData;
export type Shapes = Rectangle;

export interface DrawMessage {
  type: "draw" | "notification" | "error" | "success";
  user?: string;
  roomId?: string;
  shapeType?: ShapeType;
  shapeData?: ShapeData;
  message?: string;
  timestamp?: string;
}

export interface WebSocketJoinMessage {
  type: "join";
  roomId: string;
}

export interface WebSocketLeaveMessage {
  type: "leave";
  roomId: string;
}

export interface WebSocketDrawMessage {
  type: "draw";
  roomId: string;
  shapeType: ShapeType;
  shapeData: ShapeData;
}

export type WebSocketMessage =
  | WebSocketJoinMessage
  | WebSocketLeaveMessage
  | WebSocketDrawMessage;
