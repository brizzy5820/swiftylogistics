import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: ["delivery", "ride"],
      default: "delivery",
    },

    pickup: {
      address: {
        type: String,
        required: true,
        trim: true,
      },

      coords: {
        lat: {
          type: Number,
          required: true,
        },
        lng: {
          type: Number,
          required: true,
        },
      },
    },

    dropoff: {
      address: {
        type: String,
        required: true,
        trim: true,
      },

      coords: {
        lat: {
          type: Number,
          required: true,
        },
        lng: {
          type: Number,
          required: true,
        },
      },
    },

    packageType: {
      type: String,
      enum: ["Express", "Cargo", "Electric"],
      default: "Express",
    },

    weightKg: {
      type: Number,
      min: 0,
      default: 1,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    rideType: {
      type: String,
      trim: true,
      default: null,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    distanceKm: {
      type: Number,
      min: 0,
    },

    etaMinutes: {
      type: Number,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "pending",
        "accepted",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    trackingId: {
      type: String,
      unique: true,
      required: true,
    },

    riderName: {
      type: String,
      trim: true,
      default: null,
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
    scheduledFor: {
  type: Date,
  default: null,
},

isScheduled: {
  type: Boolean,
  default: false,
},
  },
  {
    timestamps: true,
  }
);

const Delivery = mongoose.model("Delivery", deliverySchema);

export default Delivery;