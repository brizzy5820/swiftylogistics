import mongoose from "mongoose";

const notificationSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      type: {
        type: String,
        enum: [
          "order_created",
          "order_scheduled",
          "rider_assigned",
          "order_accepted",
          "order_picked_up",
          "order_in_transit",
          "order_delivered",
          "order_cancelled",
          "system",
        ],
        required: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      message: {
        type: String,
        required: true,
        trim: true,
      },

      delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Delivery",
        default: null,
      },

      isRead: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

const Notification =
  mongoose.model(
    "Notification",
    notificationSchema
  );

export default Notification;