import {registerUser }from "../services/auth.services.js";

export const register = async (req, res) => {
  const user = await registerUser(req.body);

  return res.status(201).json({
    success: true,
    message: "Account created successfully",
    user,
  });
};

export default {
  register,
};