import mongoose from "mongoose";

const deliveryTrackingSchema = new mongoose.Schema(
  {
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      required: true,
    },

    courierPosition: {
      lat: Number,
      lng: Number,
    },

    statusTimestamps: {
      type: Map,
      of: Date,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const DeliveryTracking = mongoose.model(
  "DeliveryTracking",
  deliveryTrackingSchema
);

export default DeliveryTracking;