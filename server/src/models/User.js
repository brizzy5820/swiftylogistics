import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    avatarUrl: {
      type: String,
      trim: true,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["customer", "rider", "admin"],
      default: "customer",
    },

    department: {
      type: String,
      trim: true,
    },

    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },

    trips: {
      type: Number,
      default: 0,
    },

    vehicleType: {
      type: String,
      enum: ["Bike", "Car", "Van"],
      default: null,
    },

    vehicleColor: {
      type: String,
      trim: true,
      default: null,
    },

    plateNumber: {
      type: String,
      trim: true,
      default: null,
    },

    licenseNumber: {
      type: String,
      trim: true,
      default: null,
    },

    nin: {
      type: String,
      trim: true,
      default: null,
    },

    bankName: {
      type: String,
      trim: true,
      default: null,
    },

    accountNumber: {
      type: String,
      trim: true,
      default: null,
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;