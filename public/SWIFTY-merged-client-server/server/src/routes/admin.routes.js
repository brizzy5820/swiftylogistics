import express from "express";

import adminController from "../controllers/admin.controller.js";

import validate from "../middleware/validate.js";

import {
  protect,
} from "../middleware/authMIddleware.js";

import authorize from "../middleware/authorize.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  createUserSchema,
  setUserPasswordSchema,
  assignRiderSchema,
  updateOrderStatusSchema,
} from "../validators/admin.validator.js";

const router = express.Router();

/*
 * Everything inside this router requires:
 *
 * 1. Authentication
 * 2. Admin role
 */

router.use(protect);

router.use(
  authorize("admin")
);

/*
 * DASHBOARD
 */

router.get(
  "/dashboard",
  asyncHandler(
    adminController.getDashboard
  )
);

/*
 * USERS
 */

router.get(
  "/users",
  asyncHandler(
    adminController.getUsers
  )
);

router.post(
  "/users",
  validate(createUserSchema),
  asyncHandler(adminController.createUser)
);

router.get(
  "/users/:id",
  asyncHandler(
    adminController.getUser
  )
);

router.patch(
  "/users/:id",
  validate(updateUserSchema),
  asyncHandler(
    adminController.updateUser
  )
);

router.patch(
  "/users/:id/role",
  validate(updateUserRoleSchema),
  asyncHandler(
    adminController.updateUserRole
  )
);

router.patch(
  "/users/:id/status",
  validate(updateUserStatusSchema),
  asyncHandler(
    adminController.updateUserStatus
  )
);

router.patch(
  "/users/:id/password",
  validate(setUserPasswordSchema),
  asyncHandler(adminController.setUserPassword)
);

router.delete(
  "/users/:id",
  asyncHandler(adminController.deleteUser)
);

/*
 * RIDERS
 */

router.get(
  "/riders",
  asyncHandler(
    adminController.getRiders
  )
);

router.get(
  "/riders/available",
  asyncHandler(
    adminController.getAvailableRiders
  )
);

router.get(
  "/riders/:id",
  asyncHandler(
    adminController.getRider
  )
);

/*
 * ORDERS
 */

router.get(
  "/orders",
  asyncHandler(
    adminController.getOrders
  )
);

router.get(
  "/orders/recent",
  asyncHandler(
    adminController.getRecentOrders
  )
);

router.get(
  "/orders/:id",
  asyncHandler(
    adminController.getOrder
  )
);

/*
 * DISPATCH
 */

router.patch(
  "/orders/:orderId/assign",
  validate(assignRiderSchema),
  asyncHandler(
    adminController.assignRider
  )
);

router.patch(
  "/orders/:orderId/auto-assign",
  asyncHandler(
    adminController.autoAssignRider
  )
);

router.patch(
  "/orders/:orderId/status",
  validate(updateOrderStatusSchema),
  asyncHandler(
    adminController.updateOrderStatus
  )
);

router.patch(
  "/orders/:orderId/reset",
  asyncHandler(adminController.resetOrder)
);

router.delete(
  "/orders/:orderId",
  asyncHandler(adminController.deleteOrder)
);

router.patch(
  "/orders/:orderId/cancel",
  asyncHandler(
    adminController.cancelOrder
  )
);

export default router;