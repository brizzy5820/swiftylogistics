import deliveryService from "../services/delivery.service.js";

const createDelivery = async (req, res) => {
  const delivery = await deliveryService.createDelivery(
    req.user._id,
    req.body
  );

  return res.status(201).json({
    success: true,
    message: "Delivery created successfully",
    delivery,
  });
};

const getDeliveries = async (req, res) => {
  const deliveries =
    await deliveryService.getUserDeliveries(
      req.user._id,
      req.user.role
    );

  return res.status(200).json({
    success: true,
    deliveries,
  });
};

const getDelivery = async (req, res) => {
  const delivery =
    await deliveryService.getDeliveryById(
      req.user._id,
      req.params.id
    );

  return res.status(200).json({
    success: true,
    delivery,
  });
};

const cancelDelivery = async (req, res) => {
  const delivery =
    await deliveryService.cancelDelivery(
      req.user._id,
      req.params.id
    );

  return res.status(200).json({
    success: true,
    message: "Delivery cancelled successfully",
    delivery,
  });
};

export default {
  createDelivery,
  getDeliveries,
  getDelivery,
  cancelDelivery,
};