import { z } from "zod";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),

    phone: z
      .string()
      .trim()
      .min(7, "Invalid phone number")
      .max(20, "Phone number is too long")
      .optional(),

    role: z
      .enum(["customer", "rider"])
      .default("customer"),
  })
  .strict();

const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email"),

    password: z
      .string()
      .min(1, "Password is required")
      .max(128, "Password is too long"),
  })
  .strict();

const changePasswordSchema = z.object({ password: z.string().min(8).max(128) }).strict();

export {
  registerSchema,
  loginSchema,
  changePasswordSchema,
};