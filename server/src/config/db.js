import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const isProd = process.env.NODE_ENV === "production";

mongoose.set("strictQuery", true);

/**
 * Bring the `users` collection's indexes in line with the schema.
 *
 * Background: `googleId` was declared `{ default: null, unique: true,
 * sparse: true }`, which produced a `googleId_1` unique index that accepted
 * exactly one document — the explicit null. Every account created without a
 * Google ID after that collided on it (E11000) and was reported by the auth
 * service as "email already exists", so no new customers or riders could be
 * registered at all.
 *
 * The model now declares a *partial* unique index limited to real string
 * googleIds, and hands index management to syncIndexes(). That call diffs the
 * collection against the schema, so it both replaces the mismatched googleId
 * index and drops leftovers from removed fields (e.g. isDemo_1).
 */
const reconcileUserIndexes = async () => {
  try {
    await User.syncIndexes();
    console.log("users indexes reconciled with schema");
  } catch (error) {
    // Never block startup on a best-effort correction.
    console.warn(`Index reconciliation skipped: ${error.message}`);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MongoDB connection failed: MONGO_URI is missing from environment variables (.env).");
    process.exit(1);
  }
  try {
    const connection = await mongoose.connect(uri, {
      maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 100, // concurrent queries per instance
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 60000,
      autoIndex: !isProd || process.env.MONGO_AUTO_INDEX === "true",
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    await reconcileUserIndexes();
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
