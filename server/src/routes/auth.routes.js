import express from "express";
import { register, login, me, updatePassword, socialLogin, forgotPassword, resetPassword, switchMode, addRole } from "../controllers/auth.controller.js";
import validate from "../middleware/validate.js";
import { protect } from "../middleware/authMIddleware.js";
import { registerSchema, loginSchema, changePasswordSchema } from "../validators/auth.validator.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(register)
);
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(login)
);
router.post(
  "/social",
  asyncHandler(socialLogin)
);
router.post(
  "/forgot-password",
  asyncHandler(forgotPassword)
);
router.post(
  "/reset-password",
  asyncHandler(resetPassword)
);
router.get(
  "/me",
  protect,
  asyncHandler(me)
);
router.patch(
  "/password",
  protect,
  validate(changePasswordSchema),
  asyncHandler(updatePassword)
);
router.patch(
  "/mode",
  protect,
  asyncHandler(switchMode)
);
router.post(
  "/add-role",
  protect,
  asyncHandler(addRole)
);

export default router;