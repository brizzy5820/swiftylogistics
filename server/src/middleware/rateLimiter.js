import rateLimit from "express-rate-limit";

const tooMany = (message) => (req, res) =>
  res.status(429).json({ success: false, code: "RATE_LIMITED", message });

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany("Too many requests. Please slow down and try again shortly."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET",
  message: { status: "error", message: "Too many authentication attempts. Please try again in 15 minutes." },
  handler: tooMany("Too many authentication attempts. Please try again in 15 minutes."),
});

export const guestOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => Boolean(req.user),
  message: { status: "error", message: "Too many guest orders from this IP." },
  handler: tooMany("Too many guest orders from this IP. Please sign in or try again later."),
});

export default {
  apiLimiter,
  authLimiter,
  guestOrderLimiter,
};
