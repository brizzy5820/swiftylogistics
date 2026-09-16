import rideService from "../services/ride.services.js";

const createRide = async (req, res) => {
  const ride = await rideService.createRide(
    req.user._id,
    req.body
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