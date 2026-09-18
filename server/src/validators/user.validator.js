import { z } from "zod";

const updateUserSchema = z
  .object({
    avatarUrl: z.string().url().max(500).optional(),

    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long")
      .optional(),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email")
      .optional(),

    phone: z
      .string()
      .trim()
      .min(7, "Invalid phone number")
      .max(20, "Phone number is too long")
      .optional(),
  })
  .strict();

export {
  updateUserSchema,
};