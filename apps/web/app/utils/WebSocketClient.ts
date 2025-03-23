import { WEBSOCKET_URL } from "@/app/config";
import {
  Shape,
  ShapeType,
  Rectangle,
  Ellipse,
  Pen,
  Line,
  LineWithArrow,
  Diamond,
  Text,
} from "@/app/components/canvas/CanvasUtils";

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: any) => void;
type ConnectionHandler = () => void;

interface ShapePayload {
  type: ShapeType;
  color: string;
  data: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    centerX?: number;
    centerY?: number;
    radiusX?: number;
    radiusY?: number;
    points?: { x: number; y: number }[];
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    content?: string;
    fontSize?: number;
  };
}

interface WebSocketMessage {
  type: string;
  roomId?: string;
  shapeType?: ShapeType;
  shapeData?: ShapePayload;
}

export default class WebSocketClient {
  private static instance: WebSocketClient | null = null;
  private socket: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private connectHandlers: Set<ConnectionHandler> = new Set();
  private disconnectHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {}

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem("token");
    this.socket = new WebSocket(`${WEBSOCKET_URL}/?token=${token}`);

    this.socket.onopen = () => {
      console.log("Connected to WebSocket server");
      this.reconnectAttempts = 0;
      this.connectHandlers.forEach((handler) => handler());
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messageHandlers.forEach((handler) => handler(data));
    };

    this.socket.onerror = (error) => {
      this.errorHandlers.forEach((handler) => handler(error));
    };

    this.socket.onclose = () => {
      this.disconnectHandlers.forEach((handler) => handler());
      this.handleReconnect();
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(
        () => this.connect(),
        this.reconnectDelay * this.reconnectAttempts
      );
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.messageHandlers.clear();
    this.errorHandlers.clear();
    this.connectHandlers.clear();
    this.disconnectHandlers.clear();
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public joinRoom(roomId: string): void {
    this.sendMessage({ type: "join", roomId });
  }

  public leaveRoom(roomId: string): void {
    this.sendMessage({ type: "leave", roomId });
  }

  public sendDrawing(roomId: string, shape: Shape): void {
    // Format shape data to match server's expected structure
    const shapeData = {
      type: shape.type,
      color: shape.color || "#000000",
      data: (() => {
        switch (shape.type) {
          case ShapeType.Rectangle:
            const rect = shape as Rectangle;
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            };
          case ShapeType.Ellipse:
            const ellipse = shape as Ellipse;
            return {
              centerX: ellipse.centerX,
              centerY: ellipse.centerY,
              radiusX: ellipse.radiusX,
              radiusY: ellipse.radiusY,
            };
          case ShapeType.Pen:
            const pen = shape as Pen;
            return {
              points: pen.points,
            };
          case ShapeType.Line:
            const line = shape as Line;
            return {
              startX: line.startX,
              startY: line.startY,
              endX: line.endX,
              endY: line.endY,
            };
          case ShapeType.LineWithArrow:
            const arrow = shape as LineWithArrow;
            return {
              startX: arrow.startX,
              startY: arrow.startY,
              endX: arrow.endX,
              endY: arrow.endY,
            };
          case ShapeType.Diamond:
            const diamond = shape as Diamond;
            return {
              centerX: diamond.centerX,
              centerY: diamond.centerY,
              width: diamond.width,
              height: diamond.height,
            };
          case ShapeType.Text:
            const text = shape as Text;
            return {
              x: text.x,
              y: text.y,
              content: text.content,
              fontSize: text.fontSize,
            };
          default:
            return {};
        }
      })(),
    };

    this.sendMessage({
      type: "draw",
      roomId,
      shapeType: shape.type,
      shapeData,
    });
  }

  public deleteShape(roomId: string, shape: Shape): void {
    // Format shape data to match server's expected structure
    const shapeData = {
      type: shape.type,
      color: shape.color || "#000000",
      data: (() => {
        switch (shape.type) {
          case ShapeType.Rectangle:
            const rect = shape as Rectangle;
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            };
          case ShapeType.Ellipse:
            const ellipse = shape as Ellipse;
            return {
              centerX: ellipse.centerX,
              centerY: ellipse.centerY,
              radiusX: ellipse.radiusX,
              radiusY: ellipse.radiusY,
            };
          case ShapeType.Pen:
            const pen = shape as Pen;
            return {
              points: pen.points,
            };
          case ShapeType.Line:
            const line = shape as Line;
            return {
              startX: line.startX,
              startY: line.startY,
              endX: line.endX,
              endY: line.endY,
            };
          case ShapeType.LineWithArrow:
            const arrow = shape as LineWithArrow;
            return {
              startX: arrow.startX,
              startY: arrow.startY,
              endX: arrow.endX,
              endY: arrow.endY,
            };
          case ShapeType.Diamond:
            const diamond = shape as Diamond;
            return {
              centerX: diamond.centerX,
              centerY: diamond.centerY,
              width: diamond.width,
              height: diamond.height,
            };
          case ShapeType.Text:
            const text = shape as Text;
            return {
              x: text.x,
              y: text.y,
              content: text.content,
              fontSize: text.fontSize,
            };
          default:
            return {};
        }
      })(),
    };

    this.sendMessage({
      type: "delete",
      roomId,
      shapeType: shape.type,
      shapeData,
    });
  }

  private sendMessage(message: WebSocketMessage): void {
    if (this.isConnected()) {
      this.socket!.send(JSON.stringify(message));
    }
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  public onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.add(handler);
    return () => this.connectHandlers.delete(handler);
  }

  public onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => this.disconnectHandlers.delete(handler);
  }
}
