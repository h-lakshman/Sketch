import WebSocket, { WebSocketServer as WSServer } from "ws";
import { JWT_SECRET } from "@repo/server-common/config";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { parse } from "url";
import { prismaClient, ShapeType } from "@repo/db/client";

interface User {
  id: string;
  name: string;
  ws: WebSocket;
  rooms: Set<string>;
}

interface RectangleData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EllipseData {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}

interface PenData {
  points: { x: number; y: number }[];
}

type ShapeData = RectangleData | EllipseData | PenData;

interface DrawMessage {
  type: "draw" | "notification" | "error" | "success";
  user: string;
  roomId?: string;
  shapeType?: ShapeType;
  shapeData?: ShapeData;
  message?: string;
  timestamp: string;
}

class WebSocketServerSingleton {
  private static instance: WebSocketServerSingleton;
  private wss: WSServer;
  private queuedMessages: Map<string, DrawMessage[]> = new Map();
  private users: Map<string, User> = new Map();

  private constructor() {
    this.wss = new WSServer({ port: 8080 });
    this.setupWebSocketServer();
  }

  public static getInstance(): WebSocketServerSingleton {
    if (!WebSocketServerSingleton.instance) {
      WebSocketServerSingleton.instance = new WebSocketServerSingleton();
    }
    return WebSocketServerSingleton.instance;
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

  private async joinRoom(user: User, roomId: string) {
    const room = await prismaClient.room.findUnique({ where: { id: roomId } });
    if (!room) {
      user.ws.send(
        JSON.stringify({
          type: "error",
          message: "Room not found",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }
    if (user.rooms.has(roomId)) {
      user.ws.send(
        JSON.stringify({
          type: "error",
          message: "Already joined this room",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }
    user.rooms.add(roomId);
    user.ws.send(
      JSON.stringify({
        type: "success",
        message: `Joined room ${roomId}`,
        timestamp: new Date().toISOString(),
      })
    );

    this.broadCastToRoom(
      user,
      {
        type: "notification",
        message: `${user.name} has joined the room`,
        timestamp: new Date().toISOString(),
        user: user.name,
        roomId,
      },
      roomId
    );
  }

  private leaveRoom(user: User, roomId: string) {
    if (!user.rooms.has(roomId)) {
      user.ws.send(
        JSON.stringify({
          type: "error",
          message: "Not joined in this room",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }
    user.rooms.delete(roomId);
    user.ws.send(
      JSON.stringify({
        type: "success",
        message: `Left room ${roomId}`,
        timestamp: new Date().toISOString(),
      })
    );

    this.broadCastToRoom(
      user,
      {
        type: "notification",
        message: `${user.name} has left the room`,
        timestamp: new Date().toISOString(),
        user: user.name,
        roomId,
      },
      roomId
    );
  }

  private handleDraw(
    user: User,
    roomId: string,
    shapeType: ShapeType,
    shapeData: ShapeData
  ) {
    if (!user.rooms.has(roomId)) {
      user.ws.send(
        JSON.stringify({
          type: "error",
          message: "Not authorized to draw in this room",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    const timestamp = new Date().toISOString();
    const drawMessage: DrawMessage = {
      type: "draw",
      user: user.id,
      roomId,
      shapeType,
      shapeData,
      timestamp,
    };

    this.queuedMessages.set(roomId, [
      ...(this.queuedMessages.get(roomId) || []),
      drawMessage,
    ]);
    this.processQueue(roomId);

    this.broadCastToRoom(user, drawMessage, roomId);
  }

  private async processQueue(roomId: string) {
    const messages = this.queuedMessages.get(roomId);
    if (!messages || messages.length === 0) return;

    while (messages.length > 0) {
      const message = messages.shift();
      if (!message) continue;

      try {
        if (message.shapeType === ShapeType.RECTANGLE && message.shapeData) {
          const { x, y, width, height } = message.shapeData as RectangleData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.RECTANGLE,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              rectangle: { create: { x, y, width, height } },
            },
          });
        } else if (
          message.shapeType === ShapeType.ELLIPSE &&
          message.shapeData
        ) {
          const { centerX, centerY, radiusX, radiusY } =
            message.shapeData as EllipseData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.ELLIPSE,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              ellipse: { create: { centerX, centerY, radiusX, radiusY } },
            },
          });
        } else if (message.shapeType === ShapeType.PEN && message.shapeData) {
          const { points } = message.shapeData as PenData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.PEN,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              pen: { create: { points } },
            },
          });
        }
      } catch (error) {
        console.error("Error storing shape data:", error);
        this.queuedMessages.set(roomId, [...messages, message]);
        break;
      }
    }
  }

  private broadCastToRoom(user: User, message: DrawMessage, roomId: string) {
    this.users.forEach((u) => {
      if (u.rooms.has(roomId) && u.ws !== user.ws) {
        u.ws.send(JSON.stringify(message));
      }
    });
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
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

      ws.on("message", (data: WebSocket.Data) => {
        try {
          const parsedData = JSON.parse(data.toString());
          switch (parsedData.type) {
            case "join":
              this.joinRoom(currUser, parsedData.roomId);
              break;
            case "leave":
              this.leaveRoom(currUser, parsedData.roomId);
              break;
            case "draw":
              this.handleDraw(
                currUser,
                parsedData.roomId,
                parsedData.shapeType,
                parsedData.shapeData
              );
              break;
            default:
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Invalid message format",
                  timestamp: new Date().toISOString(),
                })
              );
          }
        } catch (error) {
          console.error("Error parsing message:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
              timestamp: new Date().toISOString(),
            })
          );
        }
      });

      ws.on("close", () => {
        this.users.delete(currUser.id);
        const notification: DrawMessage = {
          type: "notification",
          message: `${currUser.name} has left the room`,
          user: currUser.name,
          timestamp: new Date().toISOString(),
        };
        currUser.rooms.forEach((roomId) => {
          this.broadCastToRoom(currUser, { ...notification, roomId }, roomId);
        });
      });

      ws.send(
        JSON.stringify({
          type: "success",
          message: "Connection established",
          timestamp: new Date().toISOString(),
        })
      );
    });
  }

  public getConnectedUsers(): number {
    return this.users.size;
  }

  public getUsersInRoom(roomId: string): User[] {
    return Array.from(this.users.values()).filter((user) =>
      user.rooms.has(roomId)
    );
  }

  public closeAllConnections() {
    this.users.forEach((user) => {
      user.ws.close();
    });
    this.users.clear();
    this.queuedMessages.clear();
    this.wss.close();
  }
}

export default WebSocketServerSingleton;
