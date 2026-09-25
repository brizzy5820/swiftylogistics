import express from "express";
import { register, login, me, updatePassword, socialLogin } from "../controllers/auth.controller.js";
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

export default router;