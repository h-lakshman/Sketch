import { WEBSOCKET_URL } from "@/app/config";
import { Shape } from "@/app/components/canvas/CanvasUtils";

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: any) => void;
type ConnectionHandler = () => void;

interface WebSocketMessage {
  type: string;
  roomId?: string;
  shapeType?: string;
  shapeData?: Shape;
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
    this.sendMessage({
      type: "draw",
      roomId,
      shapeType: shape.type,
      shapeData: shape,
    });
  }

  public deleteShape(roomId: string, shape: Shape): void {
    this.sendMessage({
      type: "delete",
      roomId,
      shapeType: shape.type,
      shapeData: shape,
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
