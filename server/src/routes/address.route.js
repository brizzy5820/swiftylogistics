import express from "express";
import rateLimit from "express-rate-limit";

import addressController from "../controllers/address.controller.js";
import validate from "../middleware/validate.js";
import { protect } from "../middleware/authMIddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

import {
  createAddressSchema,
  updateAddressSchema,
} from "../validators/address.validator.js";

const router = express.Router();

// Geo lookups are public (the address field is used on the marketing site by
// signed-out visitors) and they sit in front of rate-limited public mirrors,
// so they get their own budget rather than a per-user one.
const geoLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many location lookups, please slow down.",
  },
});

router.get(
  "/geo/reverse",
  geoLimiter,
  asyncHandler(addressController.geoReverse)
);

router.get(
  "/geo/nearby",
  geoLimiter,
  asyncHandler(addressController.geoNearby)
);

router.use(protect);

router.post(
  "/",
  validate(createAddressSchema),
  asyncHandler(addressController.createAddress)
);

router.get(
  "/",
  asyncHandler(addressController.getAddresses)
);

router.get(
  "/:id",
  asyncHandler(addressController.getAddress)
);

router.patch(
  "/:id",
  validate(updateAddressSchema),
  asyncHandler(addressController.updateAddress)
);

router.delete(
  "/:id",
  asyncHandler(addressController.deleteAddress)
);

export default router;