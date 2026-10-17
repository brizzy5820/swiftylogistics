import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { userCache } from "../utils/cache.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Like `protect`, but a missing/invalid token is not an error: the request
// continues with req.user unset. Used by the guest-checkout create endpoints,
// which must work for anonymous customers. When a token IS present it still
// has to be valid — an expired session must not silently become a guest order.
const protectOptional = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return next();

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please sign in again.", 401, "SESSION_EXPIRED"));
    }
    return next(new AppError("Invalid session. Please sign in again.", 401, "INVALID_SESSION"));
  }

  try {
    const id = String(decoded.id || decoded.sub);
    let user = userCache.get(id);
    if (!user) {
      user = await User.findById(id).select("-passwordHash -password");
      if (user) userCache.set(id, user);
    }
    if (user && user.isActive) req.user = user;
    next();
  } catch (error) {
    next(error);
  }
});

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1]?.trim();
  }

  if (!token) {
    return next(new AppError("Authentication required. Please log in.", 401));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please sign in again.", 401, "SESSION_EXPIRED"));
    }
    return next(new AppError("Invalid session. Please sign in again.", 401, "INVALID_SESSION"));
  }

  const userId = decoded.id || decoded.sub;
  let currentUser = userCache.get(String(userId));
  if (!currentUser) {
    currentUser = await User.findById(userId).select("-passwordHash -password");
    if (currentUser) userCache.set(String(userId), currentUser);
  }

  if (!currentUser || !currentUser.isActive) {
    return next(new AppError("The user belonging to this token no longer exists or is deactivated.", 401));
  }

  req.user = currentUser;
  next();
});

// Allows either a logged-in Customer OR a valid Guest with x-guest-token
const protectOrGuest = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const guestToken = req.headers["x-guest-token"];

  if (authHeader && authHeader.startsWith("Bearer")) {
    const token = authHeader.split(" ")[1]?.trim();
    try {
      const decoded = verifyAccessToken(token);
      const userId = decoded.id || decoded.sub;
      const user = await User.findById(userId).select("-passwordHash -password");
      if (user && user.isActive) {
        req.user = user;
        return next();
      }
    } catch (_) {
      // Fall through to guest check if JWT expired/invalid
    }
  }

  if (guestToken) {
    try {
      const decodedGuest = jwt.verify(guestToken, process.env.JWT_SECRET);
      if (decodedGuest.isGuest && decodedGuest.guestId) {
        req.guest = {
          guestId: decodedGuest.guestId,
          name: decodedGuest.name || "Guest Customer",
          phone: decodedGuest.phone || "",
          email: decodedGuest.email || "",
        };
        return next();
      }
    } catch (err) {
      return next(new AppError("Invalid or expired guest session.", 401));
    }
  }

  return next(new AppError("Please sign in or continue as a valid guest.", 401));
});

export { protect, protectOptional, protectOrGuest };
export default protect;
