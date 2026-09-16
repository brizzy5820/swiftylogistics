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

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  phone: z.string().trim().min(7).max(20).optional(),
  role: z.enum(["customer", "rider", "admin"]).optional(),
  department: z.string().trim().max(100).optional(),
  vehicleType: z.enum(["Bike", "Car", "Van"]).optional(),
  vehicleColor: z.string().trim().max(50).optional(),
  plateNumber: z.string().trim().max(30).optional(),
  licenseNumber: z.string().trim().max(50).optional(),
  nin: z.string().trim().max(20).optional(),
  bankName: z.string().trim().max(100).optional(),
  accountNumber: z.string().trim().max(20).optional(),
}).strict();

const setUserPasswordSchema = z.object({ password: z.string().min(8).max(128) }).strict();

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
  createUserSchema,
  setUserPasswordSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  assignRiderSchema,
  updateOrderStatusSchema,
};