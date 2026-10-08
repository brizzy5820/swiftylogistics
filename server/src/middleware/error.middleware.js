// Central error translator: every failure leaves the API with a message that
// describes exactly what went wrong plus a stable `code` for the frontend.
const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.statusCode || err.status || 500;
  let code = err.code && typeof err.code === "string" ? err.code : undefined;
  let message = err.isOperational ? err.message : undefined;

  if (!message) {
    if (err.type === "entity.parse.failed") {
      status = 400; code = "INVALID_JSON"; message = "Request body is not valid JSON.";
    } else if (err.type === "entity.too.large") {
      status = 413; code = "PAYLOAD_TOO_LARGE"; message = "Request is too large.";
    } else if (err.name === "TokenExpiredError") {
      status = 401; code = "SESSION_EXPIRED"; message = "Session expired. Please sign in again.";
    } else if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
      status = 401; code = "INVALID_SESSION"; message = "Invalid session. Please sign in again.";
    } else if (err.name === "CastError") {
      status = 400; code = "INVALID_ID"; message = `Invalid ${err.path || "id"}: ${err.value}`;
    } else if (err.name === "ValidationError" && err.errors) {
      status = 400; code = "VALIDATION_FAILED";
      message = Object.values(err.errors).map((e) => e.message).join(". ");
    } else if (err.code === 11000) {
      status = 409; code = "DUPLICATE";
      const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || "value";
      message = field === "email" ? "An account with this email already exists." : `This ${field} is already in use.`;
    } else if (err.name === "MongoServerSelectionError" || err.name === "MongoNetworkError") {
      status = 503; code = "DB_UNAVAILABLE"; message = "Service temporarily unavailable. Please try again in a moment.";
    } else {
      status = 500; code = "SERVER_ERROR"; message = "Something went wrong on our side. Please try again.";
    }
  }

  if (status >= 500) console.error(`[${req.method} ${req.originalUrl}]`, err);

  return res.status(status).json({ success: false, code: code || "ERROR", message });
};

export default errorMiddleware;
