import User from "../models/User.js";
import AppError from "../utils/AppError.js";

const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const updateUser = async (userId, updates) => {
  const user = await User.findByIdAndUpdate(
    userId,
    updates,
    {
      new: true,
      runValidators: true,
    }
  ).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const getAvailableRiders = async () => {
  return User.find({ role: "rider", isAvailable: true, isActive: true })
    .select("-passwordHash")
    .sort({ createdAt: 1 });
};

export default {
  getUserById,
  updateUser,
  getAvailableRiders,
};