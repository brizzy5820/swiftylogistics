import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    label: {
      type: String,
      trim: true,
      required: true,
    },

    contactName: {
      type: String,
      trim: true,
    },

    contactPhone: {
      type: String,
      trim: true,
    },

    addressLine: {
      type: String,
      trim: true,
      required: true,
    },

    city: {
      type: String,
      trim: true,
      required: true,
    },

    state: {
      type: String,
      trim: true,
      required: true,
    },

    country: {
      type: String,
      trim: true,
      default: "Nigeria",
    },

    coordinates: {
      latitude: Number,
      longitude: Number,
    },

    instructions: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model("Address", addressSchema);

export default Address;