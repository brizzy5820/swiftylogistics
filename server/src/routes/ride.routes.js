import express from "express";

import rideController from "../controllers/ride.controllers.js";
import validate from "../middleware/validate.js";
import { protect, protectOptional } from "../middleware/authMIddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

import {
  createRideSchema,
} from "../validators/ride.validator.js";

const router = express.Router();

// Guest checkout: an anonymous customer with an email/phone can book a ride
// without signing in. The controller turns those into guestEmail/guestPhone on
// the order, and the pending job is picked up by riders through the normal
// `status: pending` listing — no customer link required.
//
// This route is declared BEFORE the blanket `protect` below: Express runs
// middleware in registration order, so registering it afterwards would 401 an
// anonymous request before it ever reached the handler.
router.post(
  "/",
  protectOptional,
  validate(createRideSchema),
  asyncHandler(rideController.createRide)
);

router.use(protect);

router.get(
  "/",
  asyncHandler(rideController.getRides)
);

router.get(
  "/:id",
  asyncHandler(rideController.getRide)
);

router.patch(
  "/:id/assign",
  asyncHandler(rideController.assignRide)
);

router.patch(
  "/:id/cancel",
  asyncHandler(rideController.cancelRide)
);

export default router;
