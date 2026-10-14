import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { userCache } from "../utils/cache.js";

const fail = (res, status, code, message) => res.status(status).json({ success: false, code, message });

const protect = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return fail(res, 401, "AUTH_REQUIRED", "Please sign in to continue.");

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") return fail(res, 401, "SESSION_EXPIRED", "Session expired. Please sign in again.");
    return fail(res, 401, "INVALID_SESSION", "Invalid session. Please sign in again.");
  }

  try {
    const id = String(decoded.sub);
    let user = userCache.get(id);
    if (!user) {
      // Hydrated doc (not lean) because controllers call user.save() etc.
      user = await User.findById(id).select("-passwordHash");
      if (user) userCache.set(id, user);
    }
    if (!user) return fail(res, 401, "ACCOUNT_NOT_FOUND", "This account no longer exists.");
    if (!user.isActive) return fail(res, 403, "ACCOUNT_INACTIVE", "This account has been deactivated. Contact support.");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Like `protect`, but a missing/invalid token is not an error: the request
// continues with req.user unset. Used by the guest-checkout create endpoints,
// which must work for anonymous customers. When a token IS present it still
// has to be valid — an expired session must not silently become a guest order.
const protectOptional = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return next();

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") return fail(res, 401, "SESSION_EXPIRED", "Session expired. Please sign in again.");
    return fail(res, 401, "INVALID_SESSION", "Invalid session. Please sign in again.");
  }

  try {
    const id = String(decoded.sub);
    let user = userCache.get(id);
    if (!user) {
      user = await User.findById(id).select("-passwordHash");
      if (user) userCache.set(id, user);
    }
    if (user && user.isActive) req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export { protect, protectOptional };
