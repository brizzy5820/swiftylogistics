import express from "express";
import {register,login,me} from "../controllers/auth.controller.js";
import validate from "../middleware/validate.js";
import { protect } from "../middleware/authMIddleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
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
router.get(
  "/me",
  protect,
  asyncHandler(me)
);
export default router;