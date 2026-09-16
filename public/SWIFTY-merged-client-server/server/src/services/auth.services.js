import bcrypt from "bcrypt";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { generateAccessToken } from "../utils/jwt.js";

const registerUser = async ({ name, email, password, phone, role }) => {
  const normalizedEmail = email.toLowerCase().trim();
  if (await User.findOne({ email: normalizedEmail })) throw new AppError("An account with this email already exists", 409);
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({ name, email: normalizedEmail, passwordHash, phone, role });
    return { accessToken: generateAccessToken(user), user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } };
  } catch (error) {
    if (error.code === 11000) throw new AppError("An account with this email already exists", 409);
    throw error;
  }
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError("Invalid email or password", 401);
  if (!user.isActive) throw new AppError("This account is inactive", 403);
  return { accessToken: generateAccessToken(user), user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, department: user.department } };
};

const changePassword = async (userId, newPassword) => {
  if (!newPassword || newPassword.length < 8) throw new AppError("Password must be at least 8 characters", 400);
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(userId, { passwordHash });
};

export { registerUser, loginUser, changePassword };
