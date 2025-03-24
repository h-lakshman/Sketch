import WebSocket, { WebSocketServer as WSServer } from "ws";
import { JWT_SECRET } from "@repo/server-common/config";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { parse } from "url";
import { prismaClient, ShapeType } from "@repo/db/client";

enum StrokeStyle {
  SOLID = "SOLID",
  DASHED = "DASHED",
  DOTTED = "DOTTED",
}

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
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  color: string;
}

interface EllipseData {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  color: string;
}

interface PenData {
  points: { x: number; y: number }[];
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  color: string;
}

interface LineData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  color: string;
}

interface LineWithArrowData extends LineData {}

interface DiamondData {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  color: string;
}

interface TextData {
  x: number;
  y: number;
  content: string;
  fontSize: number;
  color: string;
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
          const { x, y, width, height, strokeWidth, strokeStyle, color } =
            message.shapeData as RectangleData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.RECTANGLE,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              rectangle: {
                create: {
                  x,
                  y,
                  width,
                  height,
                  color,
                  strokeWidth,
                  strokeStyle,
                },
              },
            },
          });
        } else if (
          message.shapeType === ShapeType.ELLIPSE &&
          message.shapeData
        ) {
          const {
            centerX,
            centerY,
            radiusX,
            radiusY,
            strokeWidth,
            strokeStyle,
            color,
          } = message.shapeData as EllipseData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.ELLIPSE,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              ellipse: {
                create: {
                  centerX,
                  centerY,
                  radiusX,
                  radiusY,
                  color,
                  strokeWidth,
                  strokeStyle,
                },
              },
            },
          });
        } else if (message.shapeType === ShapeType.PEN && message.shapeData) {
          const { points, strokeWidth, strokeStyle, color } =
            message.shapeData as PenData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.PEN,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              pen: {
                create: {
                  points,
                  color,
                  strokeWidth,
                  strokeStyle,
                },
              },
            },
          });
        } else if (message.shapeType === ShapeType.LINE && message.shapeData) {
          const {
            startX,
            startY,
            endX,
            endY,
            strokeWidth,
            strokeStyle,
            color,
          } = message.shapeData as LineData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.LINE,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              line: {
                create: {
                  startX,
                  startY,
                  endX,
                  endY,
                  color,
                  strokeWidth,
                  strokeStyle,
                },
              },
            },
          });
        } else if (
          message.shapeType === ShapeType.LINE_WITH_ARROW &&
          message.shapeData
        ) {
          const {
            startX,
            startY,
            endX,
            endY,
            strokeWidth,
            strokeStyle,
            color,
          } = message.shapeData as LineWithArrowData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.LINE_WITH_ARROW,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              lineWithArrow: {
                create: {
                  startX,
                  startY,
                  endX,
                  endY,
                  color,
                  strokeWidth,
                  strokeStyle,
                },
              },
            },
          });
        } else if (
          message.shapeType === ShapeType.DIAMOND &&
          message.shapeData
        ) {
          const {
            centerX,
            centerY,
            width,
            height,
            strokeWidth,
            strokeStyle,
            color,
          } = message.shapeData as DiamondData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.DIAMOND,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              diamond: {
                create: {
                  centerX,
                  centerY,
                  width,
                  height,
                  color,
                  strokeWidth,
                  strokeStyle,
                },
              },
            },
          });
        } else if (message.shapeType === ShapeType.TEXT && message.shapeData) {
          const { x, y, content, fontSize, color } =
            message.shapeData as TextData;
          await prismaClient.shape.create({
            data: {
              type: ShapeType.TEXT,
              user: { connect: { id: message.user } },
              room: { connect: { id: roomId } },
              text: {
                create: {
                  x,
                  y,
                  content,
                  fontSize,
                  color,
                },
              },
            },
          });
        }
      } catch (error) {
        console.error("[DEBUG] Error processing message:", error);
        this.queuedMessages.set(roomId, [...messages, message]);
        break;
      }
    }
  }

  private broadCastToRoom(user: User, message: DrawMessage, roomId: string) {
    // For draw messages, ensure the shape data has the right format
    const broadcastMessage = { ...message };

    this.users.forEach((u) => {
      if (u.rooms.has(roomId) && u.ws !== user.ws) {
        u.ws.send(JSON.stringify(broadcastMessage));
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
        case ShapeType.LINE:
          const lineData = shapeData as LineData;
          shape = await prismaClient.shape.findFirst({
            where: {
              roomId,
              type: ShapeType.LINE,
              line: {
                startX: lineData.startX,
                startY: lineData.startY,
                endX: lineData.endX,
                endY: lineData.endY,
              },
            },
          });
          break;
        case ShapeType.LINE_WITH_ARROW:
          const arrowData = shapeData as LineWithArrowData;
          shape = await prismaClient.shape.findFirst({
            where: {
              roomId,
              type: ShapeType.LINE_WITH_ARROW,
              lineWithArrow: {
                startX: arrowData.startX,
                startY: arrowData.startY,
                endX: arrowData.endX,
                endY: arrowData.endY,
              },
            },
          });
          break;
        case ShapeType.DIAMOND:
          const diamondData = shapeData as DiamondData;
          shape = await prismaClient.shape.findFirst({
            where: {
              roomId,
              type: ShapeType.DIAMOND,
              diamond: {
                centerX: diamondData.centerX,
                centerY: diamondData.centerY,
                width: diamondData.width,
                height: diamondData.height,
              },
            },
          });
          break;
        case ShapeType.TEXT:
          const textData = shapeData as TextData;
          shape = await prismaClient.shape.findFirst({
            where: {
              roomId,
              type: ShapeType.TEXT,
              text: {
                x: textData.x,
                y: textData.y,
                content: textData.content,
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
              const shapeData = parsedData.shapeData?.data;

              this.handleDraw(
                currUser,
                parsedData.roomId,
                parsedData.shapeType,
                shapeData
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
