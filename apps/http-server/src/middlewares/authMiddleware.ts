import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/server-common/config";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization || "";
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, JWT_SECRET) as {
    username: string;
  };
  if (!decoded) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  (req as any).user = decoded;
  next();
};
 