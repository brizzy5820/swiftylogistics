import { z } from "zod";

const updateRiderSchema = z
  .object({
    vehicleType: z
      .enum(["motorcycle", "car", "van"])
      .optional(),

    vehicleNumber: z
      .string()
      .trim()
      .min(2)
      .max(30)
      .optional(),

    isAvailable: z
      .boolean()
      .optional(),

    vehicleColor: z
      .string()
      .trim()
      .max(50)
      .optional(),

    plateNumber: z
      .string()
      .trim()
      .max(30)
      .optional(),

    licenseNumber: z
      .string()
      .trim()
      .max(50)
      .optional(),

    nin: z
      .string()
      .trim()
      .min(10)
      .max(20)
      .optional(),

    bankName: z
      .string()
      .trim()
      .max(100)
      .optional(),

    accountNumber: z
      .string()
      .trim()
      .min(5)
      .max(20)
      .optional(),
  })
  .strict();

const updateDeliveryStatusSchema = z
  .object({
    status: z.enum([
      "accepted",
      "picked_up",
      "in_transit",
      "delivered",
      "cancelled",
    ]),
  })
  .strict();

export {
  updateDeliveryStatusSchema,
  updateRiderSchema,
};