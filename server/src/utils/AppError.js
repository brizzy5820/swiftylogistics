class AppError extends Error {
  /**
   * @param {string} message Human-readable message shown to the user.
   * @param {number} statusCode HTTP status.
   * @param {string} [code] Stable machine code the frontend can switch on.
   */
  constructor(message, statusCode = 500, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || AppError.defaultCode(statusCode);
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static defaultCode(status) {
    return ({ 400: "BAD_REQUEST", 401: "UNAUTHORIZED", 403: "FORBIDDEN", 404: "NOT_FOUND", 409: "CONFLICT", 429: "RATE_LIMITED" })[status] || "SERVER_ERROR";
  }
}

export default AppError;
