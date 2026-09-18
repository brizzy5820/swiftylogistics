import express from "express";
import trackingController from "../controllers/tracking.controller.js";
import { protect } from "../middleware/authMIddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/public/:trackingId", asyncHandler(trackingController.getPublicTracking));
router.use(protect);
router.get("/:deliveryId", asyncHandler(trackingController.getTracking));
router.patch("/:deliveryId/confirm", asyncHandler(trackingController.confirmTracking));
router.get("/:deliveryId/messages", asyncHandler(trackingController.getMessages));

export default router;
