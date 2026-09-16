import trackingService from "../services/tracking.services.js";

const getTracking = async (req, res) => {
  const tracking = await trackingService.getTracking(req.user._id, req.params.deliveryId);
  return res.status(200).json({ success: true, tracking });
};

const getPublicTracking = async (req, res) => {
  const tracking = await trackingService.getPublicTracking(req.params.trackingId);
  return res.status(200).json({ success: true, tracking });
};

export default { getTracking, getPublicTracking };
