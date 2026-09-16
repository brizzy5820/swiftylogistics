import express from "express";

import userController from "../controllers/user.controller.js";
import validate from "../middleware/validate.js";
import { updateUserSchema } from "../validators/user.validator.js";
import { protect } from "../middleware/authMIddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/riders/available",
  protect,
  asyncHandler(userController.getAvailableRiders)
);

router.get(
  "/me",
  protect,
  asyncHandler(userController.getMe)
);

router.patch(
  "/me",
  protect,
  validate(updateUserSchema),
  asyncHandler(userController.updateMe)
);

export default router;