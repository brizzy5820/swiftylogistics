import express from "express";

import deliveryController from "../controllers/delivery.controller.js";
import validate from "../middleware/validate.js";
import { protect, protectOptional } from "../middleware/authMIddleware.js";
import { guestOrderLimiter } from "../middleware/rateLimiter.js";
import asyncHandler from "../utils/asyncHandler.js";

import { createDeliverySchema } from "../validators/dellivery.validator.js";

const router = express.Router();

// Guest checkout: an anonymous customer can send a package without signing in.
// They send inline pickup/dropoff plus a contact, since they have no saved
// addresses. Declared before the blanket `protect` so an anonymous request is
// not rejected before it reaches the handler.
router.post(
  "/",
  protectOptional,
  guestOrderLimiter,
  validate(createDeliverySchema),
  asyncHandler(deliveryController.createDelivery)
);

router.use(protect);

router.get(
  "/",
  asyncHandler(deliveryController.getDeliveries)
);

router.get(
  "/:id",
  asyncHandler(deliveryController.getDelivery)
);

router.patch(
  "/:id/cancel",
  asyncHandler(deliveryController.cancelDelivery)
);

export default router;
