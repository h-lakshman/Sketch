import { z } from "zod";

export const authSchema = z.object({
  username: z
    .string()
    .email("Must be a valid email address")
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});
