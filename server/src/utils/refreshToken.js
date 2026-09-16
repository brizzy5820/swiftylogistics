import crypto from "crypto";

 const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const hashRefreshToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

export {
  generateRefreshToken,
  hashRefreshToken,
};