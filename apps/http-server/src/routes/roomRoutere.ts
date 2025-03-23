import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { prismaClient } from "@repo/db/client";

const roomRouter: Router = Router();

roomRouter.post("/create-room", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { name } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const roomExists = await prismaClient.room.findFirst({
      where: {
        slug: slug,
      },
    });
    if (roomExists) {
      res.status(400).json({
        error: "Room already exists",
      });
      return;
    }
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
roomRouter.get("/:id/shapes", authMiddleware, async (req, res) => {
  const { id } = req.params;
  //in future only allow ppl who are in the room to see the chat
  if (!id) {
    res.status(400).json({
      error: "Room ID is required",
    });
    return;
  }
  try {
    const room = await prismaClient.room.findUnique({
      where: {
        id: id,
      },
    });

    if (!room) {
      res.status(404).json({
        error: "Room not found",
      });
      return;
    }
    const shapes = await prismaClient.shape.findMany({
      where: {
        room: {
          id: id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        rectangle: true,
        ellipse: true,
        pen: true,
        line: true,
        lineWithArrow: true,
        diamond: true,
        text: true,
      },
    });

    res.status(200).json({
      message: "Shapes fetched successfully",
      shapes,
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

roomRouter.get("/:slug", authMiddleware, async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    res.status(400).json({
      error: "Room ID is required",
    });
    return;
  }
  try {
    const room = await prismaClient.room.findUnique({
      where: {
        slug: slug,
      },
    });
    if (!room) {
      res.status(404).json({
        error: "Room not found",
      });
      return;
    }
    res.status(200).json({
      message: "Room fetched successfully",
      room,
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default roomRouter;
