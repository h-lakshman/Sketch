import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/server-common/config";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ message: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      name: string;
    };

    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        name: string;
      };
    }
  }
}
