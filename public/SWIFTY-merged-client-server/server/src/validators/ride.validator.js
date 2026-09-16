import { z } from "zod";

const locationSchema = z.object({
  address: z.string().trim().min(1),
  coords: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

const createRideSchema = z.object({
  pickup: locationSchema.optional(),
  dropoff: locationSchema.optional(),
  pickupAddress: z.string().min(1).optional(),
  dropoffAddress: z.string().min(1).optional(),
  rideType: z.string().trim().min(1).max(50),
  scheduledFor: z.string().datetime().optional(),
}).refine(
  (data) => (data.pickup && data.dropoff) || (data.pickupAddress && data.dropoffAddress),
  { message: "Pickup and drop-off locations are required", path: ["pickup"] }
).strict();

export { createRideSchema };
