import mongoose from "mongoose";
import { userCache, invalidateUser } from "../utils/cache.js";

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
      default: null,
    },

    googleId: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
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

userSchema.index({ role: 1, isActive: 1 });

// Keep the auth user cache coherent: any write to a user evicts its cache entry.
const evict = (id) => { if (id) invalidateUser(id); };
userSchema.post("save", (doc) => evict(doc._id));
userSchema.post(["findOneAndUpdate", "findOneAndDelete"], (doc) => evict(doc?._id));
userSchema.pre(["updateOne", "updateMany", "deleteOne", "deleteMany"], function () {
  const id = this.getFilter?.()._id;
  if (id && typeof id !== "object") evict(id); else if (id) evict(String(id));
  if (!id) userCache.clear();
});

const User = mongoose.model("User", userSchema);

export default User;