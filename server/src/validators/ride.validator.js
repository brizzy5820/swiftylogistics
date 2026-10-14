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
  // The price the customer saw and selected on the ride option card. The
  // server still clamps this to the option's valid price band server-side
  // (see calculateFare in ride.services.js) so a tampered value can't be
  // used to pay less/more than the real fare — but a legitimate selection
  // is now honoured instead of being silently overwritten.
  customPrice: z.number().positive().max(1_000_000).optional(),
  paymentMethod: z.string().trim().min(1).max(50).optional(),
  // Guest checkout: anonymous customers send a contact so the assigned rider
  // can reach them. Must be declared here — validate() replaces req.body with
  // the parsed output, which strips undeclared keys.
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
})

export { createRideSchema };
