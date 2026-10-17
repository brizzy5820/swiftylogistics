import crypto from "crypto";
import Delivery from "../models/Delivery.js";
import Address from "../models/Address.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";
import notificationService from "./notification.service.js";
import { emitJobAvailable, emitJobAssigned, emitOrderUpdate, emitGuestUpdate } from "../socket.js";

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

// Mirrors client/src/data/app-data.js RIDE_OPTIONS
const RIDE_PRICE_CONFIG = {
  economy: { pricePerKm: 150, minPrice: 1500, maxPrice: 3000 },
  comfort: { pricePerKm: 200, minPrice: 2200, maxPrice: 4500 },
  xl: { pricePerKm: 250, minPrice: 3000, maxPrice: 6000 },
};

const priceConfigFor = (rideType) => RIDE_PRICE_CONFIG[rideType] || RIDE_PRICE_CONFIG.economy;

const calculateFare = (distanceKm, rideType) => {
  const config = priceConfigFor(rideType);
  const raw = config.pricePerKm * Math.max(1, Math.ceil(distanceKm));
  return Math.round(Math.min(Math.max(raw, config.minPrice), config.maxPrice));
};

const resolvePrice = (distanceKm, rideType, customPrice) => {
  if (typeof customPrice === "number" && Number.isFinite(customPrice) && customPrice > 0) {
    const config = priceConfigFor(rideType);
    return Math.round(Math.min(Math.max(customPrice, config.minPrice), config.maxPrice));
  }
  return calculateFare(distanceKm, rideType);
};

const createRide = async (userId, data, guestContact = null) => {
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
  const farePrice = resolvePrice(distanceKm, data.rideType, data.customPrice);

  const isGuest = !userId;
  const guestInfo = (isGuest || guestContact) ? {
    guestId: data.guestInfo?.guestId || data.guestId || `guest_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    name: data.guestInfo?.name || data.name || pickup.contactName || "Guest Customer",
    phone: guestContact?.phone?.trim() || data.guestPhone || pickup.contactPhone || "",
    email: guestContact?.email?.toLowerCase()?.trim() || data.guestEmail || "",
  } : undefined;

  const rideData = {
    customer: userId || null,
    isGuestOrder: isGuest,
    guestInfo,
    guestEmail: guestContact?.email?.toLowerCase()?.trim() || data.guestEmail?.toLowerCase()?.trim() || null,
    guestPhone: guestContact?.phone?.trim() || data.guestPhone?.trim() || null,
    type: "ride",
    pickup: {
      address: pickup.address,
      coords: pickup.coords,
      lat: pickup.coords.lat,
      lng: pickup.coords.lng,
      contactName: pickup.contactName || guestInfo?.name,
      contactPhone: pickup.contactPhone || guestInfo?.phone,
    },
    dropoff: {
      address: dropoff.address,
      coords: dropoff.coords,
      lat: dropoff.coords.lat,
      lng: dropoff.coords.lng,
      recipientName: dropoff.recipientName,
      recipientPhone: dropoff.recipientPhone,
    },
    rideType: data.rideType,
    price: farePrice,
    fare: farePrice,
    paymentMethod: data.paymentMethod || "cash",
    distanceKm: Math.round(distanceKm * 10) / 10,
    etaMinutes: Math.max(5, Math.round(distanceKm * 4)),
    status: initialStatus,
    isScheduled: Boolean(scheduledFor),
    scheduledFor,
    trackingId,
    courierPosition: scheduledFor ? null : pickup.coords,
    statusTimestamps: { [initialStatus]: new Date() },
    timeline: [
      {
        status: initialStatus,
        timestamp: new Date(),
        note: scheduledFor ? "Ride scheduled" : "Ride requested",
      },
    ],
  };

  const ride = await Delivery.create(rideData);

  if (initialStatus === "pending") emitJobAvailable(ride);

  return ride;
};

const getUserRides = async (userId) => {
  if (!userId) return [];
  return Delivery.find({ customer: userId, type: "ride" })
    .populate("rider", "name phone vehicleType vehicleColor plateNumber rating")
    .sort({ createdAt: -1 });
};

const getRideById = async (userId, rideId) => {
  const query = userId ? { _id: rideId, customer: userId, type: "ride" } : { _id: rideId, type: "ride" };
  const ride = await Delivery.findOne(query)
    .populate("rider", "name phone vehicleType vehicleColor plateNumber rating")
    .populate("customer", "name phone email avatar");
  if (!ride) throw new AppError("Ride not found", 404);
  return ride;
};

const cancelRide = async (userId, rideId) => {
  const query = userId ? { _id: rideId, customer: userId, type: "ride" } : { _id: rideId, type: "ride" };
  const ride = await Delivery.findOne(query);
  if (!ride) throw new AppError("Ride not found", 404);
  if (["delivered", "cancelled"].includes(ride.status)) throw new AppError("This ride can no longer be cancelled", 400);
  ride.status = "cancelled";
  ride.isScheduled = false;
  if (!ride.statusTimestamps) ride.statusTimestamps = new Map();
  ride.statusTimestamps.set("cancelled", new Date());
  if (!ride.timeline) ride.timeline = [];
  ride.timeline.push({ status: "cancelled", timestamp: new Date(), note: "Ride cancelled" });
  await ride.save();
  if (ride.rider) await User.findByIdAndUpdate(ride.rider, { isAvailable: true });
  emitOrderUpdate(ride);
  if (ride.isGuestOrder && ride.guestInfo?.guestId) {
    emitGuestUpdate(ride.guestInfo.guestId, ride);
  }
  return ride;
};

const assignRide = async (userId, rideId) => {
  const query = userId ? { _id: rideId, customer: userId, type: "ride" } : { _id: rideId, type: "ride" };
  const ride = await Delivery.findOne(query);
  if (!ride) throw new AppError("Ride not found", 404);
  if (ride.rider) return ride.populate("rider", "name phone vehicleType vehicleColor plateNumber rating");
  if (ride.status !== "pending") throw new AppError("Only pending rides can be assigned", 400);

  const rider = await User.findOne({ role: "rider", isAvailable: true, isActive: true }).sort({ rating: -1, trips: 1 });
  if (!rider) return null;

  ride.rider = rider._id;
  ride.riderName = rider.name;
  ride.status = "accepted";
  if (!ride.statusTimestamps) ride.statusTimestamps = new Map();
  ride.statusTimestamps.set("accepted", new Date());
  if (!ride.timeline) ride.timeline = [];
  ride.timeline.push({ status: "accepted", timestamp: new Date(), note: `Accepted by ${rider.name}` });
  if (ride.pickup?.coords) {
    ride.courierPosition = ride.pickup.coords;
  }
  await ride.save();
  await User.findByIdAndUpdate(rider._id, { isAvailable: false });
  await ride.populate("rider", "name phone vehicleType vehicleColor plateNumber rating");
  if (ride.customer) {
    await ride.populate("customer", "name phone email avatar");
  }

  // Guard notification
  const customerId = ride.customer?._id || (typeof ride.customer === "string" ? ride.customer : null);
  if (customerId) {
    try {
      await notificationService.createNotification({
        userId: customerId,
        type: "order_accepted",
        title: "Ride Accepted",
        message: `${rider.name} has accepted your ride.`,
        deliveryId: ride._id,
      });
    } catch (_) {}
  }

  emitOrderUpdate(ride);
  emitJobAssigned(ride);
  if (ride.isGuestOrder && ride.guestInfo?.guestId) {
    emitGuestUpdate(ride.guestInfo.guestId, ride);
  }
  return ride;
};

export default { createRide, getUserRides, getRideById, cancelRide, assignRide };
