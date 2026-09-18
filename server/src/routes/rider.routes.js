import express from "express";
import riderController from "../controllers/rider.controller.js";
import validate from "../middleware/validate.js";
import { protect } from "../middleware/authMIddleware.js";
import authorize from "../middleware/authorize.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { updateRiderSchema, updateDeliveryStatusSchema } from "../validators/rider.validator.js";

const router = express.Router();
router.use(protect, authorize("rider"));
router.get("/me", asyncHandler(riderController.getProfile));
router.patch("/me", validate(updateRiderSchema), asyncHandler(riderController.updateProfile));
router.get("/jobs", asyncHandler(riderController.getJobs));
router.get("/jobs/:id", asyncHandler(riderController.getJob));
router.patch("/jobs/:id/accept", asyncHandler(riderController.acceptJob));
router.patch("/deliveries/:deliveryId/status", validate(updateDeliveryStatusSchema), asyncHandler(riderController.updateDeliveryStatus));
export default router;
