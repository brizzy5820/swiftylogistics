// Validates req.body with a zod schema. The top-level `message` is the first
// concrete problem (e.g. "Please provide a valid email") instead of a generic one.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const field = issue.path.join(".");
      let message = issue.message;
      if (issue.code === "unrecognized_keys") message = `Unexpected field(s): ${issue.keys.join(", ")}`;
      else if (issue.code === "invalid_type" && issue.received === "undefined") message = `${field || "Field"} is required`;
      return { field, message };
    });
    return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: errors[0]?.message || "Invalid request", errors });
  }
  req.body = result.data;
  next();
};

export default validate;
