import crypto from "crypto";

import Delivery from "../models/Delivery.js";
import Address from "../models/Address.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";
import { emitJobAvailable, emitOrderUpdate } from "../socket.js";

const generateTrackingId = () => {
  return `TRK-${Date.now().toString(36).toUpperCase()}${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
};

const calculateDistance = (a, b) => {
  const R = 6371;

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(x),
      Math.sqrt(1 - x)
    )
  );
};

const calculatePrice = (
  distanceKm,
  packageType
) => {
  const basePrice = distanceKm * 3;

  const surcharge =
    packageType === "Cargo"
      ? 8
      : packageType === "Express"
        ? 4
        : 2;

  return Math.round(basePrice + surcharge);
};

const hasValidCoordinates = (coordinates) => {
  return (
    coordinates &&
    typeof coordinates.latitude === "number" &&
    typeof coordinates.longitude === "number" &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
};

const buildAddressSnapshot = (address) => {
  return {
    address: `${address.addressLine}, ${address.city}, ${address.state}`,
    coords: {
      lat: address.coordinates.latitude,
      lng: address.coordinates.longitude,
    },
  };
};

const createDelivery = async (
  userId,
  data
) => {
  const pickupAddress = await Address.findOne({
    _id: data.pickupAddress,
    user: userId,
  });

  if (!pickupAddress) {
    throw new AppError(
      "Pickup address not found",
      404
    );
  }

  const dropoffAddress = await Address.findOne({
    _id: data.dropoffAddress,
    user: userId,
  });

  if (!dropoffAddress) {
    throw new AppError(
      "Drop-off address not found",
      404
    );
  }

  if (
    !hasValidCoordinates(
      pickupAddress.coordinates
    ) ||
    !hasValidCoordinates(
      dropoffAddress.coordinates
    )
  ) {
    throw new AppError(
      "Both addresses must have valid coordinates",
      400
    );
  }

  const pickup =
    buildAddressSnapshot(pickupAddress);

  const dropoff =
    buildAddressSnapshot(dropoffAddress);

  const distanceKm = calculateDistance(
    pickup.coords,
    dropoff.coords
  );

  const packageType =
    data.packageType || "Express";

  const scheduledFor = data.scheduledFor
    ? new Date(data.scheduledFor)
    : null;

  if (
    scheduledFor &&
    (
      Number.isNaN(scheduledFor.getTime()) ||
      scheduledFor <= new Date()
    )
  ) {
    throw new AppError(
      "Scheduled time must be in the future",
      400
    );
  }

  const isScheduled =
    Boolean(scheduledFor);

  const initialStatus = isScheduled
    ? "scheduled"
    : "pending";

  const delivery = await Delivery.create({
    customer: userId,

    type: "delivery",

    pickup,

    dropoff,

    packageType,

    weightKg: data.weightKg || 1,

    note: data.note || "",

    price: calculatePrice(
      distanceKm,
      packageType
    ),

    distanceKm:
      Math.round(distanceKm * 10) / 10,

    etaMinutes: Math.max(
      5,
      Math.round(distanceKm * 4)
    ),

    status: initialStatus,

    trackingId: generateTrackingId(),

    rider: null,

    riderName: null,

    courierPosition: isScheduled
      ? null
      : pickup.coords,

    statusTimestamps: {
      [initialStatus]: new Date(),
    },

    scheduledFor,

    isScheduled,
  });

  if (initialStatus === "pending") emitJobAvailable(delivery);

  return delivery;
};

const getUserDeliveries = async (
  userId,
  role = "customer"
) => {
  const filter = role === "rider"
    ? {
        type: { $in: ["delivery", "ride"] },
        $or: [
          { rider: userId },
          { status: "pending", rider: null },
        ],
      }
    : { customer: userId };

  return Delivery.find(filter)
    .populate(
      "rider",
      "name phone vehicleType vehicleColor plateNumber rating"
    )
    .sort({
      createdAt: -1,
    });
};

const getDeliveryById = async (
  userId,
  deliveryId
) => {
  const delivery =
    await Delivery.findOne({
      _id: deliveryId,
      customer: userId,
      type: "delivery",
    }).populate(
      "rider",
      "name phone vehicleType vehicleColor plateNumber rating"
    );

  if (!delivery) {
    throw new AppError(
      "Delivery not found",
      404
    );
  }

  return delivery;
};

const cancelDelivery = async (
  userId,
  deliveryId
) => {
  const delivery =
    await Delivery.findOne({
      _id: deliveryId,
      customer: userId,
      type: "delivery",
    });

  if (!delivery) {
    throw new AppError(
      "Delivery not found",
      404
    );
  }

  if (
    ["delivered", "cancelled"].includes(
      delivery.status
    )
  ) {
    throw new AppError(
      "This delivery can no longer be cancelled",
      400
    );
  }

  delivery.status = "cancelled";

  delivery.isScheduled = false;

  if (!delivery.statusTimestamps) {
    delivery.statusTimestamps =
      new Map();
  }

  delivery.statusTimestamps.set(
    "cancelled",
    new Date()
  );

  await delivery.save();

  if (delivery.rider) {
    await User.findByIdAndUpdate(delivery.rider, { isAvailable: true });
  }

  emitOrderUpdate(delivery);

  return delivery;
};

const getDeliveryByTrackingId = async (
  trackingId
) => {
  const delivery =
    await Delivery.findOne({
      trackingId,
    }).populate(
      "rider",
      "name phone vehicleType vehicleColor plateNumber rating"
    );

  if (!delivery) {
    throw new AppError(
      "Delivery not found",
      404
    );
  }

  return delivery;
};

export default {
  createDelivery,
  getUserDeliveries,
  getDeliveryById,
  cancelDelivery,
  getDeliveryByTrackingId,
};