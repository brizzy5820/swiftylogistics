import mongoose from "mongoose";

const notificationSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
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
        required: false,
      },

      title: {
        type: String,
        required: false,
        trim: true,
      },

      message: {
        type: String,
        required: false,
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

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification =
  mongoose.model(
    "Notification",
    notificationSchema
  );

export default Notification;