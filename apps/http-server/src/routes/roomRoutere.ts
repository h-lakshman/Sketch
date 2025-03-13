import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { prismaClient } from "@repo/db/client";

const roomRouter: Router = Router();

roomRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { name } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    console.log(req.user);
    const room = await prismaClient.room.create({
      data: {
        slug,
        adminId: user.userId,
      },
    });
    if (!room) {
      res.status(400).json({
        error: "Failed to create room",
      });
      return;
    }
    res.status(201).json({
      message: "Room created successfully",
      roomId: room.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default roomRouter;
