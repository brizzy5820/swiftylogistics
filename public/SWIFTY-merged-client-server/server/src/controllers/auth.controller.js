import { registerUser, loginUser, changePassword } from "../services/auth.services.js";

const register = async (req, res) => {
  const { accessToken, user } = await registerUser(req.body);
  return res.status(201).json({ success: true, message: "Account created successfully", accessToken, user });
};

const login = async (req, res) => {
  const { accessToken, user } = await loginUser(req.body);
  return res.status(200).json({ success: true, message: "Login successful", accessToken, user });
};

const me = async (req, res) => res.status(200).json({ success: true, user: req.user });

const updatePassword = async (req, res) => {
  await changePassword(req.user._id, req.body.password);
  return res.status(200).json({ success: true, message: "Password updated successfully" });
};

export { register, login, me, updatePassword };
