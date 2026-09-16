import express from "express";

import notificationController from "../controllers/notification.controller.js";
import { protect } from "../middleware/authMIddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.use(protect);

router.get(
  "/",
  asyncHandler(
    notificationController.getNotifications
  )
);

router.get(
  "/unread-count",
  asyncHandler(
    notificationController.getUnreadCount
  )
);

router.patch(
  "/read-all",
  asyncHandler(
    notificationController.markAllAsRead
  )
);

router.patch(
  "/:id/read",
  asyncHandler(
    notificationController.markAsRead
  )
);

export default router;