import express from "express";

import riderController from "../controllers/rider.controller.js";
import validate from "../middleware/validate.js";
import { protect } from "../middleware/authMIddleware.js";
import authorize from "../middleware/authorize.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

import { updateRiderSchema, updateDeliveryStatusSchema } from "../validators/rider.validator.js";

const router = express.Router();

router.use(protect);
router.use(authorize("rider"));
router.post(
  "/assign/:deliveryId",
  authorize("admin"),
  asyncHandler(riderController.assignRider)
);
router.get(
  "/me",
  asyncHandler(riderController.getProfile)
);

router.patch(
  "/me",
  validate(updateRiderSchema),
  asyncHandler(riderController.updateProfile)
);
router.patch(
  "/deliveries/:deliveryId/status",
  validate(updateDeliveryStatusSchema),
  asyncHandler(
    riderController.updateDeliveryStatus
  )
);
export default router;