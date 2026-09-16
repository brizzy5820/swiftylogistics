import riderService from "../services/rider.services.js";

const getProfile = async (req, res) => {
  const rider = await riderService.getRiderProfile(
    req.user._id
  );

  return res.status(200).json({
    success: true,
    rider,
  });
};

const updateProfile = async (req, res) => {
  const rider =
    await riderService.updateRiderProfile(
      req.user._id,
      req.body
    );

  return res.status(200).json({
    success: true,
    message: "Rider profile updated successfully",
    rider,
  });
};
const updateDeliveryStatus = async (req, res) => {
  const delivery =
    await riderService.updateDeliveryStatus(
      req.user._id,
      req.params.deliveryId,
      req.body.status
    );

  return res.status(200).json({
    success: true,
    message: "Delivery status updated successfully",
    delivery,
  });
};
const assignRider = async (req, res) => {
  const delivery =
    await riderService.findAvailableRider(
      req.params.deliveryId
    );

  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: "No available rider found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Rider assigned successfully",
    delivery,
  });
};
export default {
  getProfile,
  assignRider,
  updateProfile,
  updateDeliveryStatus,
};