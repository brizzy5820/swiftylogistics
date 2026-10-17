import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

import errorMiddleware from "./middleware/error.middleware.js";
import { apiLimiter, authLimiter, guestOrderLimiter } from "./middleware/rateLimiter.js";

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

// 1. Helmet: security HTTP response headers
app.use(helmet());

// 2. CORS: origin restriction and credential handling
const origins = (process.env.CLIENT_URL || "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-guest-token"],
  credentials: true,
  maxAge: 86400, // cache CORS preflight for 24h -> one less round trip per request
}));

// 3. Compression: gzip response payloads > 1KB
app.use(compression({ threshold: 1024 }));

// 4. Body parsers (single express.json call)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 5. Data sanitization against NoSQL query injection (Express 5 compatible)
app.use((req, res, next) => {
  ['body', 'params', 'headers'].forEach((key) => {
    if (req[key]) req[key] = mongoSanitize.sanitize(req[key]);
  });
  if (req.query) {
    mongoSanitize.sanitize(req.query);
  }
  next();
});

// 6. HTTP Parameter Pollution protection
app.use(hpp());

// Cache control for API responses: user-specific private caching
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "private, no-cache");
  next();
});

// Health check endpoint (exempt from rate limiters)
app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ success: true, message: "Swifty API is running", uptime: process.uptime() });
});

// 7. Rate limiters
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// 8. Routes
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

export { authLimiter, guestOrderLimiter };
export default app;
