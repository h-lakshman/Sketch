import WebSocket, { WebSocketServer } from "ws";
import { JWT_SECRET } from "@repo/server-common/config";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { parse } from "url";
import { prismaClient } from "@repo/db/client";
import {
  ShapeType,
  ShapeData,
  RectangleData,
  DrawMessage,
  WebSocketMessage,
} from "@repo/common/canvasTypes";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  id: string;
  name: string;
  ws: WebSocket;
  rooms: Set<string>;
}

const queuedMessages: Map<string, DrawMessage[]> = new Map();
const users: Map<string, User> = new Map();

const authMiddleware = (req: IncomingMessage) => {
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
};

async function joinRoom(user: User, roomId: string) {
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

  broadCastToRoom(
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

function leaveRoom(user: User, roomId: string) {
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

  broadCastToRoom(
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

function handleDraw(
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

  queuedMessages.set(roomId, [
    ...(queuedMessages.get(roomId) || []),
    drawMessage,
  ]);
  processQueue(roomId);

  broadCastToRoom(user, drawMessage, roomId);
}

async function processQueue(roomId: string) {
  const messages = queuedMessages.get(roomId);
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
      }
    } catch (error) {
      console.error("Error storing shape data:", error);
      queuedMessages.set(roomId, [...messages, message]);
      break;
    }
  }
}

function broadCastToRoom(user: User, message: DrawMessage, roomId: string) {
  users.forEach((u) => {
    if (u.rooms.has(roomId) && u.ws !== user.ws) {
      u.ws.send(JSON.stringify(message));
    }
  });
}

wss.on("connection", function connection(ws, req) {
  const decoded = authMiddleware(req);
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
  users.set(currUser.id, currUser);

  ws.on("message", function message(data) {
    try {
      const parsedData = JSON.parse(data.toString());
      switch (parsedData.type) {
        case "join":
          joinRoom(currUser, parsedData.roomId);
          break;
        case "leave":
          leaveRoom(currUser, parsedData.roomId);
          break;
        case "draw":
          handleDraw(
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
    users.delete(currUser.id);
    const notification: DrawMessage = {
      type: "notification",
      message: `${currUser.name} has left the room`,
      user: currUser.name,
      timestamp: new Date().toISOString(),
    };
    currUser.rooms.forEach((roomId) => {
      broadCastToRoom(currUser, { ...notification, roomId }, roomId);
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
