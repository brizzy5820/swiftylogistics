import rideService from "../services/ride.services.js";

const createRide = async (req, res) => {
  const { email, phone, ...rideData } = req.body;
  // Authenticated customers book against their own account; anonymous ones
  // book as a guest, so we need at least one way for the rider to reach them.
  const userId = req.user?._id || null;
  const guestContact = (!req.user && (email || phone)) ? { email, phone } : null;

  if (!userId && !guestContact) {
    return res.status(400).json({
      success: false,
      code: "GUEST_CONTACT_REQUIRED",
      message: "Provide an email or phone number so your rider can reach you.",
    });
  }

  const ride = await rideService.createRide(
    userId,
    rideData,
    guestContact
  );

  return res.status(201).json({
    success: true,
    message: "Ride created successfully",
    ride,
  });
};

const getRides = async (req, res) => {
  const rides = await rideService.getUserRides(
    req.user._id
  );

  return res.status(200).json({
    success: true,
    rides,
  });
};

const getRide = async (req, res) => {
  const ride = await rideService.getRideById(
    req.user._id,
    req.params.id
  );

  return res.status(200).json({
    success: true,
    ride,
  });
};

const cancelRide = async (req, res) => {
  const ride = await rideService.cancelRide(
    req.user._id,
    req.params.id
  );

  return res.status(200).json({
    success: true,
    message: "Ride cancelled successfully",
    ride,
  });
};

const assignRide = async (req, res) => {
  const ride = await rideService.assignRide(req.user._id, req.params.id);
  if (!ride) return res.status(404).json({ success: false, message: "No available rider found" });
  return res.status(200).json({ success: true, message: "Rider assigned successfully", ride });
};

export default {
  createRide,
  getRides,
  getRide,
  cancelRide,
  assignRide,
};