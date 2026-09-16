import { z } from "zod";

const createRideSchema = z
  .object({
    pickupAddress: z
      .string()
      .min(1, "Pickup address is required"),

    dropoffAddress: z
      .string()
      .min(1, "Drop-off address is required"),

    rideType: z
      .string()
      .trim()
      .min(1, "Ride type is required")
      .max(50, "Ride type is too long"),

    scheduledFor: z
      .string()
      .datetime()
      .optional(),
  })
  .strict();

export {
  createRideSchema
};