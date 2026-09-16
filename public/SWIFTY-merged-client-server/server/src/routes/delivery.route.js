import express from "express";

import deliveryController from "../controllers/delivery.controller.js";
import validate from "../middleware/validate.js";
import { protect } from "../middleware/authMIddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

import { createDeliverySchema } from "../validators/dellivery.validator.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  validate(createDeliverySchema),
  asyncHandler(deliveryController.createDelivery)
);

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