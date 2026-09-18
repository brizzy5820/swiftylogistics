import trackingService from "../services/tracking.services.js";

const getTracking = async (req, res) => {
  const tracking = await trackingService.getTracking(req.user._id, req.params.deliveryId);
  return res.status(200).json({ success: true, tracking });
};

const getPublicTracking = async (req, res) => {
  const tracking = await trackingService.getPublicTracking(req.params.trackingId);
  return res.status(200).json({ success: true, tracking });
};

const confirmTracking = async (req, res) => {
  const delivery = await trackingService.confirmTracking(req.user._id, req.params.deliveryId);
  return res.status(200).json({ success: true, message: "Confirmed", delivery });
};

const getMessages = async (req, res) => {
  const messages = await trackingService.getMessages(req.user._id, req.params.deliveryId);
  return res.status(200).json({ success: true, messages });
};

export default { getTracking, getPublicTracking, confirmTracking, getMessages };
