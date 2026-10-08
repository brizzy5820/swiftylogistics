import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import errorMiddleware from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import addressRoutes from "./routes/address.route.js";
import deliveryRoutes from "./routes/delivery.route.js";
import userRoutes from "./routes/user.routes.js";
import riderRoutes from "./routes/rider.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import supportRoutes from "./routes/support.routes.js";
import rideRoutes from "./routes/ride.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("etag", "strong"); // lets browsers revalidate with 304s instead of re-downloading
app.set("trust proxy", 1); // correct client IPs behind a load balancer (needed for rate limiting)

const origins = (process.env.CLIENT_URL || "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // cache CORS preflight for 24h -> one less round trip per request
}));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression({ threshold: 1024 }));
app.use(express.json({ limit: "1mb" }));

// Every API response is user-specific: private caching only.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "private, no-cache");
  next();
});

const tooMany = (message) => (req, res) =>
  res.status(429).json({ success: false, code: "RATE_LIMITED", message });

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  skip: (req) => req.method === "GET",
  handler: tooMany("Too many sign-in attempts. Please wait a few minutes and try again."),
}));
app.use("/api", rateLimit({
  windowMs: 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false,
  handler: tooMany("Too many requests. Please slow down and try again shortly."),
}));

app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ success: true, message: "Swifty API is running", uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api", (req, res) =>
  res.status(404).json({ success: false, code: "ROUTE_NOT_FOUND", message: `No endpoint for ${req.method} ${req.originalUrl}` }));

app.use(errorMiddleware);

export default app;
