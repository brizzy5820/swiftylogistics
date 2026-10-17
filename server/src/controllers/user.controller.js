import userService from "../services/user.services.js";

const DANGEROUS_FIELDS = [
  "role",
  "roles",
  "isActive",
  "isAdmin",
  "department",
  "resetPasswordToken",
  "resetPasswordExpire",
  "passwordHash",
  "password",
  "googleId",
];

const getMe = async (req, res) => {
  const user = await userService.getUserById(req.user._id);

  return res.status(200).json({
    success: true,
    user,
  });
};

const updateMe = async (req, res) => {
  const sanitizedUpdates = { ...req.body };
  for (const field of DANGEROUS_FIELDS) {
    delete sanitizedUpdates[field];
  }

  // Prevent activeMode from being escalated to admin
  if (sanitizedUpdates.activeMode === "admin") {
    delete sanitizedUpdates.activeMode;
  }

  const user = await userService.updateUser(
    req.user._id,
    sanitizedUpdates
  );

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
};

const getAvailableRiders = async (req, res) => {
  const riders = await userService.getAvailableRiders();
  return res.status(200).json({ success: true, riders });
};

export default {
  getMe,
  updateMe,
  getAvailableRiders,
};