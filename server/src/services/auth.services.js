
import bcrypt from "bcrypt";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

export  const registerUser = async ({
  name,
  email,
  password,
  phone,
}) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new AppError(
      "An account with this email already exists",
      409
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      phone,
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  } catch (error) {
    // MongoDB duplicate-key error
    if (error.code === 11000) {
      throw new AppError(
        "An account with this email already exists",
        409
      );
    }

    throw error;
  }
};


