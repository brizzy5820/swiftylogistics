import mongoose from "mongoose";

const isProd = process.env.NODE_ENV === "production";

mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 100, // concurrent queries per instance
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 60000,
      autoIndex: !isProd || process.env.MONGO_AUTO_INDEX === "true",
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
