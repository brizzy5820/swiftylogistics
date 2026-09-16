import { z } from "zod";

const createDeliverySchema = z
  .object({
    pickupAddress: z
      .string()
      .min(1, "Pickup address is required"),

    dropoffAddress: z
      .string()
      .min(1, "Drop-off address is required"),

    packageType: z
      .enum(["Express", "Cargo", "Electric"])
      .optional(),

    weightKg: z
      .number()
      .min(1)
      .max(50)
      .optional(),

    note: z
      .string()
      .trim()
      .max(500)
      .optional(),

    scheduledFor: z
      .string()
      .datetime()
      .optional(),
  })
  .strict();

export {
  createDeliverySchema,
};