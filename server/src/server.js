import dotenv from "dotenv";
dotenv.config();

import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import seedAdmin from "./config/seedAdmin.js";
import connectDB from "./config/db.js";
import startScheduler from "./services/scheduler.service.js";
import { initSocket } from "./socket.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedAdmin();
  const server = http.createServer(app);
  // Keep-alive longer than typical load-balancer idle timeouts (60s) to avoid 502s.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.requestTimeout = 30_000;

  initSocket(server);
  // Run the scheduler on exactly one instance when horizontally scaled.
  if (process.env.RUN_SCHEDULER !== "false") startScheduler();

  server.listen(PORT, () => console.log(`Swifty API running on port ${PORT}`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));

startServer();
