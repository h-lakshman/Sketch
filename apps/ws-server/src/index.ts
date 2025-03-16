import WebSocket, { WebSocketServer } from "ws";
import { JWT_SECRET } from "@repo/server-common/config";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { parse } from "url";
import { prismaClient } from "@repo/db/client";
const wss = new WebSocketServer({ port: 8080 });

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
interface QueuedMessage {
  userId: string;
  roomId: string;
  message: string;
  timestamp: string;
}

const users: Map<string, User> = new Map();
const queuedMessages: Map<string, Message[]> = new Map();

const authMiddleware = (req: IncomingMessage) => {
  if (!req.url) {
    return null;
  }
  const parameters = parse(req.url, true);
  const token = parameters.query.token as string;

  if (!token) {
    return null;
  }
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
  const room = await prismaClient.room.findUnique({
    where: {
      id: roomId,
    },
  });
  if (!room) {
    user.ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
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
  broadCastToRoom(
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

function leaveRoom(user: User, roomId: string) {
  if (!user.rooms.has(roomId)) {
    user.ws.send(
      JSON.stringify({
        type: "error",
        message: "Unexpected error,Not joined in this room",
      })
    );
    return;
  }
  user.rooms.delete(roomId);
  user.ws.send(
    JSON.stringify({ type: "success", message: `Left room ${roomId}` })
  );
  broadCastToRoom(
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

function sendMessage(user: User, roomId: string, message: string) {
  if (!user.rooms.has(roomId)) {
    user.ws.send(
      JSON.stringify({
        type: "error",
        message: "Unexpected error,Not authorized to send message in this room",
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

  queuedMessages.get(roomId)?.push(chatMessage) ??
    queuedMessages.set(roomId, [chatMessage]);
  processQueue(roomId);

  broadCastToRoom(user, chatMessage, roomId);
}

async function processQueue(roomId: string) {
  const messages = queuedMessages.get(roomId);
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
      queuedMessages.set(roomId, [...messages, message]);
      break;
    }
  }
}
function broadCastToRoom(user: User, message: Message, roomId: string) {
  users.forEach((u) => {
    if (u.rooms.has(roomId) && u.ws != user.ws) {
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
        case "chat":
          sendMessage(currUser, parsedData.roomId, parsedData.message);
          break;
        default:
          ws.send(
            JSON.stringify({ type: "error", message: "Invalid message format" })
          );
      }
    } catch (error) {
      console.error("Error parsing message:", error);
      ws.send(
        JSON.stringify({ type: "error", message: "Invalid message format" })
      );
    }
  });
  ws.on("close", () => {
    users.delete(currUser.id);
    const message = {
      type: "notification",
      message: `${currUser.name} has left the room`,
      user: currUser.name,
      timestamp: new Date().toISOString(),
    };
    currUser.rooms.forEach((roomId) => {
      broadCastToRoom(currUser, message, roomId);
    });
  });

  ws.send(
    JSON.stringify({ type: "success", message: "Connection established" })
  );
});
