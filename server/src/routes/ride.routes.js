import express from "express";

import rideController from "../controllers/ride.controllers.js";
import validate from "../middleware/validate.js";
import { protect } from "../middleware/authMIddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

import {
  createRideSchema,
} from "../validators/ride.validator.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  validate(createRideSchema),
  asyncHandler(rideController.createRide)
);

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