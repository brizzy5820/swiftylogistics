import bcrypt from "bcrypt";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { generateAccessToken } from "../utils/jwt.js";
import crypto from 'crypto';
const registerUser = async ({ name, email, password, phone, role }) => {
  if (role === "admin" || (Array.isArray(role) && role.includes("admin"))) {
    throw new AppError("Admin registration is not allowed", 403, "INVALID_ROLE");
  }
  const signupRole = role === "rider" ? "rider" : "customer";
  const roles = [signupRole];
  const activeMode = signupRole;

  const normalizedEmail = email.toLowerCase().trim();
  if (await User.exists({ email: normalizedEmail })) throw new AppError("An account with this email already exists", 409);
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      phone,
      role: signupRole,
      roles,
      activeMode,
    });
    return {
      accessToken: generateAccessToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roles: user.roles,
        activeMode: user.activeMode,
        department: user.department,
        avatarUrl: user.avatarUrl,
      },
    };
  } catch (error) {
    if (error.code === 11000) throw new AppError("An account with this email already exists", 409);
    throw error;
  }
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  if (!user.passwordHash) {
    throw new AppError("This account uses Google sign-in. Please continue with Google.", 400, "USE_GOOGLE_SIGNIN");
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  if (!user.isActive) throw new AppError("This account has been deactivated. Contact support.", 403, "ACCOUNT_INACTIVE");
  return {
    accessToken: generateAccessToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      roles: user.roles?.length ? user.roles : [user.role],
      activeMode: user.activeMode || user.role,
      department: user.department,
      avatarUrl: user.avatarUrl,
    },
  };
};

const changePassword = async (userId, newPassword) => {
  if (!newPassword || newPassword.length < 8) throw new AppError("Password must be at least 8 characters", 400);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(userId, { passwordHash });
};

const forgotPassword = async (email) => {
  if (!email) throw new AppError("Please provide an email address", 400);
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
  }

  const plainToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/auth?view=reset-password&token=${plainToken}`;
  console.log(`[PASSWORD RESET] Reset URL: ${resetUrl}`);

  return {
    success: true,
    message: "Password reset link sent successfully. Please check your email.",
    resetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
  };
};

const resetPassword = async (token, newPassword) => {
  if (!token) throw new AppError("Reset token is required", 400);
  if (!newPassword || newPassword.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const hashedToken = crypto.createHash("sha256").update(String(token).trim()).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    throw new AppError("Invalid or expired password reset link. Please request a new one.", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({ validateBeforeSave: false });

  return {
    success: true,
    message: "Password has been reset successfully. You can now log in.",
  };
};

const resetPasswordWithCode = async ({ email, code, newPassword }) => {
  const hashedToken = crypto.createHash("sha256").update(String(code).trim()).digest("hex");

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    throw new AppError("Invalid or expired reset code. Please request a new one.", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};

export { registerUser, loginUser, changePassword, forgotPassword, resetPassword, resetPasswordWithCode };