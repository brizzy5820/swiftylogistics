import deliveryService from "../services/delivery.service.js";

const createDelivery = async (req, res) => {
  const { guestEmail, guestPhone, ...data } = req.body;
  // Authenticated customers book against their own account; anonymous ones
  // book as a guest and need a way for the rider to reach them.
  const userId = req.user?._id || null;
  const guestContact = (!req.user && (guestEmail || guestPhone))
    ? { email: guestEmail, phone: guestPhone }
    : null;

  if (!userId && !guestContact) {
    return res.status(400).json({
      success: false,
      code: "GUEST_CONTACT_REQUIRED",
      message: "Provide an email or phone number so your rider can reach you.",
    });
  }

  const delivery = await deliveryService.createDelivery(
    userId,
    { ...data, guestEmail: guestContact?.email, guestPhone: guestContact?.phone }
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