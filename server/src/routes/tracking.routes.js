import express from "express";

import trackingController from "../controllers/tracking.controller.js";
import { protect } from "../middleware/authMIddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.use(protect);

router.get(
  "/:deliveryId",
  asyncHandler(trackingController.getTracking)
);

export default router;