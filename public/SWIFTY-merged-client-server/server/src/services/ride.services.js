import crypto from "crypto";
import Delivery from "../models/Delivery.js";
import Address from "../models/Address.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";

const calculateDistance = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const calculateFare = (distanceKm, rideType) => {
  const baseFare = distanceKm * 4;
  const multiplier = rideType === "premium" ? 1.5 : rideType === "comfort" ? 1.25 : 1;
  return Math.round(baseFare * multiplier);
};

const createRide = async (userId, data) => {
  let pickup;
  let dropoff;

  const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
  if (scheduledFor && (Number.isNaN(scheduledFor.getTime()) || scheduledFor <= new Date())) {
    throw new AppError("Scheduled time must be in the future", 400);
  }

  if (data.pickup?.address && data.dropoff?.address) {
    pickup = data.pickup;
    dropoff = data.dropoff;
  } else {
    const pickupAddress = await Address.findOne({ _id: data.pickupAddress, user: userId });
    const dropoffAddress = await Address.findOne({ _id: data.dropoffAddress, user: userId });

    if (!pickupAddress) throw new AppError("Pickup address not found", 404);
    if (!dropoffAddress) throw new AppError("Drop-off address not found", 404);

    const p = pickupAddress.coordinates;
    const d = dropoffAddress.coordinates;
    if (!p || !d || typeof p.latitude !== "number" || typeof p.longitude !== "number" || typeof d.latitude !== "number" || typeof d.longitude !== "number") {
      throw new AppError("Both addresses must have valid coordinates", 400);
    }

    pickup = { address: `${pickupAddress.addressLine}, ${pickupAddress.city}, ${pickupAddress.state}`, coords: { lat: p.latitude, lng: p.longitude } };
    dropoff = { address: `${dropoffAddress.addressLine}, ${dropoffAddress.city}, ${dropoffAddress.state}`, coords: { lat: d.latitude, lng: d.longitude } };
  }

  if (!pickup?.coords || !dropoff?.coords) throw new AppError("Both locations must have valid coordinates", 400);

  const distanceKm = calculateDistance(pickup.coords, dropoff.coords);
  const initialStatus = scheduledFor ? "scheduled" : "pending";
  const trackingId = `RIDE-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

  return Delivery.create({
    customer: userId,
    type: "ride",
    pickup,
    dropoff,
    rideType: data.rideType,
    price: calculateFare(distanceKm, data.rideType),
    distanceKm: Math.round(distanceKm * 10) / 10,
    etaMinutes: Math.max(5, Math.round(distanceKm * 4)),
    status: initialStatus,
    isScheduled: Boolean(scheduledFor),
    scheduledFor,
    trackingId,
    courierPosition: scheduledFor ? null : pickup.coords,
    statusTimestamps: { [initialStatus]: new Date() },
  });
};

const getUserRides = async (userId) => Delivery.find({ customer: userId, type: "ride" })
  .populate("rider", "name phone vehicleType vehicleColor plateNumber rating")
  .sort({ createdAt: -1 });

const getRideById = async (userId, rideId) => {
  const ride = await Delivery.findOne({ _id: rideId, customer: userId, type: "ride" })
    .populate("rider", "name phone vehicleType vehicleColor plateNumber rating");
  if (!ride) throw new AppError("Ride not found", 404);
  return ride;
};

const cancelRide = async (userId, rideId) => {
  const ride = await Delivery.findOne({ _id: rideId, customer: userId, type: "ride" });
  if (!ride) throw new AppError("Ride not found", 404);
  if (["delivered", "cancelled"].includes(ride.status)) throw new AppError("This ride can no longer be cancelled", 400);
  ride.status = "cancelled";
  ride.isScheduled = false;
  if (!ride.statusTimestamps) ride.statusTimestamps = new Map();
  ride.statusTimestamps.set("cancelled", new Date());
  await ride.save();
  if (ride.rider) await User.findByIdAndUpdate(ride.rider, { isAvailable: true });
  return ride;
};

const assignRide = async (userId, rideId) => {
  const ride = await Delivery.findOne({ _id: rideId, customer: userId, type: "ride" });
  if (!ride) throw new AppError("Ride not found", 404);
  if (ride.rider) return ride.populate("rider", "name phone vehicleType vehicleColor plateNumber rating");
  if (ride.status !== "pending") throw new AppError("Only pending rides can be assigned", 400);

  const rider = await User.findOne({ role: "rider", isAvailable: true, isActive: true }).sort({ rating: -1, trips: 1 });
  if (!rider) return null;

  ride.rider = rider._id;
  ride.riderName = rider.name;
  ride.status = "accepted";
  ride.statusTimestamps.set("accepted", new Date());
  ride.courierPosition = ride.pickup.coords;
  await ride.save();
  await User.findByIdAndUpdate(rider._id, { isAvailable: false });
  return ride.populate("rider", "name phone vehicleType vehicleColor plateNumber rating");
};

export default { createRide, getUserRides, getRideById, cancelRide, assignRide };
