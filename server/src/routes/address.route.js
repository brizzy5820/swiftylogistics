import express from "express";

import addressController from "../controllers/address.controller.js";
import validate from "../middleware/validate.js";
import { protect } from "../middleware/authMIddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

import {
  createAddressSchema,
  updateAddressSchema,
} from "../validators/address.validator.js";

const router = express.Router();

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