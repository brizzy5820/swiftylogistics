import userService from "../services/user.services.js";

const getMe = async (req, res) => {
  const user = await userService.getUserById(req.user._id);

  return res.status(200).json({
    success: true,
    user,
  });
};

const updateMe = async (req, res) => {
  const user = await userService.updateUser(
    req.user._id,
    req.body
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