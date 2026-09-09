
import bcrypt from "bcrypt";

import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { generateAccessToken} from "../utils/jwt.js"
import RefreshToken from "../models/RefreshToken.js";
import {generateRefreshToken,hashRefreshToken,} from "../utils/refreshToken.js";
// Sign in user
 const registerUser = async ({ 
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
// User login
 const loginUser = async ({email, password})=>{
  const normalizeEmail =   email.toLowerCase().trim()
const user = await User.findOne({email:normalizeEmail})

if (!user){
  throw new AppError ("Invalid email or Password",401)
}
const matchPassword = await bcrypt.compare(password, user.passwordHash)
if(!matchPassword){
  throw new AppError("Invalid email or Password",401)
}
  const accessToken = generateAccessToken(user)
  return{
    accessToken,
    id: user._id,
    email:user.email,
    phone:user.phone,
    name:user.name,
    role: user.role,

  }
 }
 const createRefreshToken = async (userId) => {
  const token = generateRefreshToken();

  const tokenHash = hashRefreshToken(token);

  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  );

  await RefreshToken.create({
    user: userId,
    tokenHash,
    expiresAt,
  });

  return token;
};

export{
  registerUser, loginUser, createRefreshToken
}