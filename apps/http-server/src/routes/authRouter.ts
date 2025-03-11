import { Router } from "express";
import { authSchema } from "@repo/common/schema";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/server-common/config";

const authRouter: Router = Router();

authRouter.post("/register", (req, res) => {
  const result = authSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: result.error.flatten().fieldErrors,
    });
    return;
  }
  const { username, password } = result.data;
  // TODO: Save user to database

  res.status(200).json({
    message: "User registered successfully",
  });
});

authRouter.post("/login", (req, res) => {
  const result = authSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: result.error.flatten().fieldErrors,
    });
    return;
  }
  const { username, password } = result.data;
  // TODO: Check if user exists in database

  // TODO: Check if password is correct

  // TODO: Generate a token
  const token = jwt.sign({ username }, JWT_SECRET);

  // TODO: Send token to user

  res.status(200).json({
    message: "User logged in successfully",
    token,
  });
});

export default authRouter;
