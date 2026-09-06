import express from "express";
import {register} from "../controllers/auth.controller.js";
import validate from "../middleware/validate.js";
import { registerSchema } from "../validators/auth.validator.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(register)
);

export default router;