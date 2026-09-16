import { z } from "zod";

const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    phone: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .optional(),

    department: z
      .string()
      .trim()
      .max(100)
      .optional(),

    role: z
      .enum(["customer", "rider", "admin"])
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  })
  .strict();

const updateUserRoleSchema = z
  .object({
    role: z.enum([
      "customer",
      "rider",
      "admin",
    ]),
  })
  .strict();

const updateUserStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

const assignRiderSchema = z
  .object({
    riderId: z
      .string()
      .min(1, "Rider ID is required"),
  })
  .strict();

const updateOrderStatusSchema = z
  .object({
    status: z.enum([
      "pending",
      "accepted",
      "picked_up",
      "in_transit",
      "delivered",
      "cancelled",
    ]),
  })
  .strict();

export {
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  assignRiderSchema,
  updateOrderStatusSchema,
};