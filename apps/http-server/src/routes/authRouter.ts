import { Router } from "express";
import { registerSchema, loginSchema } from "@repo/common/schema";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/server-common/config";
import { prismaClient } from "@repo/db/client";
import argon2 from "argon2";

const authRouter: Router = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: result.error.flatten().fieldErrors,
      });
      return;
    }
    const { username, password, name } = result.data;
    const userExists = await prismaClient.user.findFirst({
      where: {
        email: username,
      },
    });
    if (userExists) {
      res.status(400).json({
        error: "User already exists",
      });
      return;
    }
    const hashedPassword = await argon2.hash(password);
    await prismaClient.user.create({
      data: {
        email: username,
        password: hashedPassword,
        name,
      },
    });
    res.status(200).json({
      message: "Account created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: result.error.flatten().fieldErrors,
      });
      return;
    }
    const { username, password } = result.data;

    const user = await prismaClient.user.findFirst({
      where: {
        email: username,
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: "Invalid credentials",
      });
      return;
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      res.status(401).json({
        error: "Invalid credentials",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
      },
      JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default authRouter;
