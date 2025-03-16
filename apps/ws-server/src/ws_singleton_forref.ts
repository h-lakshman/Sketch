import WebSocket, { WebSocketServer } from "ws";
import { JWT_SECRET } from "@repo/server-common/config";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { parse } from "url";
import { prismaClient } from "@repo/db/client";

interface User {
  id: string;
  name: string;
  ws: WebSocket;
  rooms: Set<string>;
}

interface Message {
  type: string;
  user: string;
  message: string;
  timestamp: string;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private users: Map<string, User> = new Map();
  private queuedMessages: Map<string, Message[]> = new Map();
  private wss: WebSocketServer;

  private constructor() {
    this.wss = new WebSocketServer({ port: 8080 });
    this.setupWebSocket();
  }

  // Singleton instance getter
  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private setupWebSocket() {
    this.wss.on("connection", (ws, req) => {
      const decoded = this.authMiddleware(req);
      if (!decoded) {
        ws.close(1008, "Authentication failed or user already connected");
        return;
      }

      const currUser: User = {
        id: decoded.userId,
        name: decoded.name,
        ws,
        rooms: new Set(),
      };

      this.users.set(currUser.id, currUser);
      ws.send(
        JSON.stringify({ type: "success", message: "Connection established" })
      );

      ws.on("message", (data) => this.handleMessage(currUser, data.toString()));
      ws.on("close", () => this.handleDisconnect(currUser));
    });
  }

  private authMiddleware(req: IncomingMessage) {
    if (!req.url) return null;
    const parameters = parse(req.url, true);
    const token = parameters.query.token as string;

    if (!token) return null;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        name: string;
      };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  private handleMessage(user: User, data: string) {
    try {
      const parsedData = JSON.parse(data);
      switch (parsedData.type) {
        case "join":
          this.joinRoom(user, parsedData.roomId);
          break;
        case "leave":
          this.leaveRoom(user, parsedData.roomId);
          break;
        case "chat":
          this.sendMessage(user, parsedData.roomId, parsedData.message);
          break;
        default:
          user.ws.send(
            JSON.stringify({ type: "error", message: "Invalid message format" })
          );
      }
    } catch (error) {
      console.error("Error parsing message:", error);
      user.ws.send(
        JSON.stringify({ type: "error", message: "Invalid message format" })
      );
    }
  }

  private handleDisconnect(user: User) {
    this.users.delete(user.id);
    const message = {
      type: "notification",
      message: `${user.name} has left the room`,
      user: user.name,
      timestamp: new Date().toISOString(),
    };
    user.rooms.forEach((roomId) => this.broadCastToRoom(user, message, roomId));
  }

  async joinRoom(user: User, roomId: string) {
    const room = await prismaClient.room.findUnique({ where: { id: roomId } });
    if (!room) {
      user.ws.send(
        JSON.stringify({ type: "error", message: "Room not found" })
      );
      return;
    }
    if (user.rooms.has(roomId)) {
      user.ws.send(
        JSON.stringify({ type: "error", message: "Already joined this room" })
      );
      return;
    }
    user.rooms.add(roomId);
    user.ws.send(
      JSON.stringify({ type: "success", message: `Joined room ${roomId}` })
    );

    this.broadCastToRoom(
      user,
      {
        type: "notification",
        message: `${user.name} has joined the room`,
        timestamp: new Date().toISOString(),
        user: user.name,
      },
      roomId
    );
  }

  leaveRoom(user: User, roomId: string) {
    if (!user.rooms.has(roomId)) {
      user.ws.send(
        JSON.stringify({ type: "error", message: "Not joined in this room" })
      );
      return;
    }
    user.rooms.delete(roomId);
    user.ws.send(
      JSON.stringify({ type: "success", message: `Left room ${roomId}` })
    );

    this.broadCastToRoom(
      user,
      {
        type: "notification",
        message: `${user.name} has left the room`,
        timestamp: new Date().toISOString(),
        user: user.name,
      },
      roomId
    );
  }

  sendMessage(user: User, roomId: string, message: string) {
    if (!user.rooms.has(roomId)) {
      user.ws.send(
        JSON.stringify({
          type: "error",
          message: "Not authorized to send messages in this room",
        })
      );
      return;
    }
    const timestamp = new Date().toISOString();
    const chatMessage: Message = {
      type: "chat",
      user: user.id,
      message,
      timestamp,
    };

    this.queuedMessages.get(roomId)?.push(chatMessage) ??
      this.queuedMessages.set(roomId, [chatMessage]);
    this.processQueue(roomId);
    this.broadCastToRoom(user, chatMessage, roomId);
  }

  async processQueue(roomId: string) {
    const messages = this.queuedMessages.get(roomId);
    if (!messages || messages.length === 0) return;

    while (messages.length > 0) {
      const message = messages.shift();
      if (!message) continue;
      try {
        await prismaClient.chat.create({
          data: {
            message: message.message,
            roomId: roomId,
            userId: message.user,
            createdAt: message.timestamp,
          },
        });
      } catch (error) {
        console.error("Error storing message:", error);
        this.queuedMessages.set(roomId, [...messages, message]);
        break;
      }
    }
  }

  broadCastToRoom(user: User, message: Message, roomId: string) {
    this.users.forEach((u) => {
      if (u.rooms.has(roomId) && u.ws !== user.ws) {
        u.ws.send(JSON.stringify(message));
      }
    });
  }
}

// Initialize singleton instance
WebSocketManager.getInstance();
