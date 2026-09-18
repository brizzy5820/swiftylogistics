import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import seedAdmin from "./config/seedAdmin.js";
import connectDB from "./config/db.js";
import startScheduler from "./services/scheduler.service.js";
import { initSocket } from "./socket.js";
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedAdmin();
  const server = http.createServer(app);
  // Init the realtime layer before the scheduler so the scheduler's first
  // sweep can emit assignment events.
  initSocket(server);
  startScheduler();
  server.listen(PORT, () => {
    console.log(`Swifty API running on port ${PORT}`);
  });
};

startServer();
