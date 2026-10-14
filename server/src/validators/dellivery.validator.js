import { z } from "zod";

const inlineLocation = z.object({
  address: z.string().min(1, "Address is required"),
  coords: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

const createDeliverySchema = z
  .object({
    pickupAddress: z.string().min(1).optional(),
    dropoffAddress: z.string().min(1).optional(),

    // Guest checkout: inline locations instead of saved-address ids.
    pickup: inlineLocation.optional(),
    dropoff: inlineLocation.optional(),

    // Guest checkout: at least one is required for anonymous bookings.
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().min(1).optional(),

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
  .strict()
  .refine((data) => Boolean(data.pickupAddress || data.pickup), {
    message: "Pickup is required",
    path: ["pickupAddress"],
  })
  .refine((data) => Boolean(data.dropoffAddress || data.dropoff), {
    message: "Drop-off is required",
    path: ["dropoffAddress"],
  });

export {
  createDeliverySchema,
};
