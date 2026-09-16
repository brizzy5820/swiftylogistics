import { z } from "zod";

const createAddressSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(2, "Label is required")
      .max(50, "Label is too long"),

    contactName: z
      .string()
      .trim()
      .max(100, "Contact name is too long")
      .optional(),

    contactPhone: z
      .string()
      .trim()
      .min(7, "Invalid phone number")
      .max(20, "Phone number is too long")
      .optional(),

    addressLine: z
      .string()
      .trim()
      .min(5, "Address is too short")
      .max(250, "Address is too long"),

    city: z
      .string()
      .trim()
      .min(2)
      .max(100),

    state: z
      .string()
      .trim()
      .min(2)
      .max(100),

    country: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),

    instructions: z
      .string()
      .trim()
      .max(500, "Instructions are too long")
      .optional(),
  })
  .strict();

const updateAddressSchema = createAddressSchema.partial();

export {
  createAddressSchema,
  updateAddressSchema,
};