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

interface LineData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface LineWithArrowData extends LineData {}

interface DiamondData {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

interface TextData {
  x: number;
  y: number;
  content: string;
  fontSize: number;
}

type ShapeData =
  | RectangleData
  | EllipseData
  | PenData
  | LineData
  | LineWithArrowData
  | DiamondData
  | TextData;
enum MessageType {
  DRAW = "draw",
  DELETE = "delete",
  NOTIFICATION = "notification",
  ERROR = "error",
  SUCCESS = "success",
}
interface DrawMessage {
  type: MessageType;
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
        type: MessageType.NOTIFICATION,
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
          type: MessageType.ERROR,
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
        type: MessageType.NOTIFICATION,
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
      type: MessageType.DRAW,
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
        } else if (message.shapeType === ShapeType.LINE && message.shapeData) {
          const { startX, startY, endX, endY } = message.shapeData as LineData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.LINE,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              line: { create: { startX, startY, endX, endY } },
            },
          });
        } else if (
          message.shapeType === ShapeType.LINE_WITH_ARROW &&
          message.shapeData
        ) {
          const { startX, startY, endX, endY } =
            message.shapeData as LineWithArrowData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.LINE_WITH_ARROW,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              lineWithArrow: { create: { startX, startY, endX, endY } },
            },
          });
        } else if (
          message.shapeType === ShapeType.DIAMOND &&
          message.shapeData
        ) {
          const { centerX, centerY, width, height } =
            message.shapeData as DiamondData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.DIAMOND,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              diamond: { create: { centerX, centerY, width, height } },
            },
          });
        } else if (message.shapeType === ShapeType.TEXT && message.shapeData) {
          const { x, y, content, fontSize } = message.shapeData as TextData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.TEXT,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              text: { create: { x, y, content, fontSize } },
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

  private async deleteShape(
    user: User,
    roomId: string,
    shapeType: ShapeType,
    shapeData: ShapeData
  ) {
    if (!user.rooms.has(roomId)) {
      user.ws.send(
        JSON.stringify({
          type: "error",
          message: "Not authorized to delete in this room",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    try {
      let shape;
      switch (shapeType) {
        case ShapeType.RECTANGLE:
          const rectData = shapeData as RectangleData;
          shape = await prismaClient.shape.findFirst({
            where: {
              roomId,
              type: ShapeType.RECTANGLE,
              rectangle: {
                x: rectData.x,
                y: rectData.y,
                width: rectData.width,
                height: rectData.height,
              },
            },
          });
          break;
        case ShapeType.ELLIPSE:
          const ellipseData = shapeData as EllipseData;
          shape = await prismaClient.shape.findFirst({
            where: {
              roomId,
              type: ShapeType.ELLIPSE,
              ellipse: {
                centerX: ellipseData.centerX,
                centerY: ellipseData.centerY,
                radiusX: ellipseData.radiusX,
                radiusY: ellipseData.radiusY,
              },
            },
          });
          break;
        case ShapeType.PEN:
          const penData = shapeData as PenData;
          shape = await prismaClient.shape.findFirst({
            where: {
              roomId,
              type: ShapeType.PEN,
              pen: {
                points: {
                  equals: penData.points,
                },
              },
            },
          });
          break;
      }

      if (shape) {
        await prismaClient.shape.delete({
          where: {
            id: shape.id,
          },
        });

        const timestamp = new Date().toISOString();
        const deleteMessage: DrawMessage = {
          type: MessageType.DELETE,
          user: user.id,
          roomId,
          shapeType,
          shapeData,
          timestamp,
        };

        this.broadCastToRoom(user, deleteMessage, roomId);
      }
    } catch (error) {
      console.error("Error deleting shape:", error);
      user.ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to delete shape",
          timestamp: new Date().toISOString(),
        })
      );
    }
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
            case "delete":
              this.deleteShape(
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
          type: MessageType.NOTIFICATION,
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
