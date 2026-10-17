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

    themePreference: z.enum(["light", "dark", "system"]).optional(),

    activeMode: z.enum(["customer", "rider"]).optional(),

    // Explicitly forbid admin escalation for role and roles
    role: z.enum(["customer", "rider"]).optional(),
    roles: z.array(z.enum(["customer", "rider"])).optional(),

    // Catch status or admin flags to strip them
    isActive: z.any().optional(),
    isAdmin: z.any().optional(),
  })
  .transform(({ role, roles, isActive, isAdmin, ...allowed }) => allowed);

export {
  updateUserSchema,
};