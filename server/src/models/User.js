import mongoose from "mongoose";
import { userCache, invalidateUser } from "../utils/cache.js";

const userSchema = new mongoose.Schema(
  {
  roles: { type: [String], default: ['customer', 'rider'] },
  activeMode: { type: String, enum: ['customer', 'rider', 'admin'], default: 'customer' },
  themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpire: { type: Date, select: false },
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

    // NOTE: deliberately no `default: null` here. A unique index on a field that
    // is always present (even as null) collapses every non-Google account onto
    // the single allowed null and rejects them all with E11000 — which the auth
    // service then reported as "email already exists". Leaving the field unset
    // keeps it genuinely absent, and the partial index declared below only
    // indexes documents that actually have a string googleId.
    googleId: {
      type: String,
      trim: true,
    },

    passwordHash: {
      type: String,
      default: null,
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
    // Index management for this model is done explicitly in connectDB() via
    // syncIndexes(): the googleId index needed a real correction (see below),
    // and letting mongoose's autoIndex race it crashed startup on the name
    // clash. syncIndexes() diffs the collection against the schema and fixes
    // mismatched/leftover indexes instead.
    autoIndex: false,
  }
);

userSchema.index({ role: 1, isActive: 1 });

// A partial unique index rather than a sparse one: `sparse` still indexes an
// explicit null, so the previous schema default of null silently turned this
// into a single-document index. Restricting it to real string values keeps the
// uniqueness guarantee for Google accounts while leaving every ordinary
// account completely out of the index.
userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: "string" } } },
);

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
