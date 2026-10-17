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

// Guest checkout: the client sends the pickup/dropoff pair inline (same shape
// rides already use) instead of saved Address ids, because an anonymous
// customer has no address book to look ids up in.
const buildInlineSnapshot = (location) => {
  const coords = location?.coords || {};
  if (
    !location?.address ||
    typeof coords.lat !== "number" ||
    typeof coords.lng !== "number" ||
    coords.lat < -90 || coords.lat > 90 ||
    coords.lng < -180 || coords.lng > 180
  ) {
    return null;
  }
  return { address: location.address, coords: { lat: coords.lat, lng: coords.lng } };
};

const createDelivery = async (
  userId,
  data
) => {
  const isGuest = !userId;
  let pickup;
  let dropoff;

  const inlinePickup = isGuest ? buildInlineSnapshot(data.pickup) : null;
  const inlineDropoff = isGuest ? buildInlineSnapshot(data.dropoff) : null;

  if (inlinePickup && inlineDropoff) {
    pickup = inlinePickup;
    dropoff = inlineDropoff;
  } else {
    if (!isGuest) {
      const pickupAddress = await Address.findOne({
        _id: data.pickupAddress,
        user: userId,
      });

      if (!pickupAddress) {
        throw new AppError("Pickup address not found", 404);
      }

      const dropoffAddress = await Address.findOne({
        _id: data.dropoffAddress,
        user: userId,
      });

      if (!dropoffAddress) {
        throw new AppError("Drop-off address not found", 404);
      }

      if (
        !hasValidCoordinates(pickupAddress.coordinates) ||
        !hasValidCoordinates(dropoffAddress.coordinates)
      ) {
        throw new AppError("Both addresses must have valid coordinates", 400);
      }

      pickup = buildAddressSnapshot(pickupAddress);
      dropoff = buildAddressSnapshot(dropoffAddress);
    } else {
      throw new AppError(
        "Both locations must have valid coordinates",
        400
      );
    }
  }

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

  const guestInfo = isGuest ? {
    guestId: data.guestInfo?.guestId || data.guestId || `guest_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    name: data.guestInfo?.name || data.name || data.pickup?.contactName || "Guest Customer",
    phone: data.guestInfo?.phone || data.guestPhone || data.phone || data.pickup?.contactPhone || "",
    email: data.guestInfo?.email || data.guestEmail || data.email || "",
  } : undefined;

  const guestEmail = isGuest ? (data.guestEmail?.toLowerCase()?.trim() || guestInfo?.email?.toLowerCase()?.trim() || null) : null;
  const guestPhone = isGuest ? (data.guestPhone?.trim() || guestInfo?.phone?.trim() || null) : null;
  const farePrice = calculatePrice(distanceKm, packageType);

  const delivery = await Delivery.create({
    customer: userId || null,

    isGuestOrder: isGuest,

    guestInfo,

    guestEmail,

    guestPhone,

    type: "delivery",

    pickup: {
      address: pickup.address,
      coords: pickup.coords,
      lat: pickup.coords.lat,
      lng: pickup.coords.lng,
      contactName: data.pickup?.contactName || guestInfo?.name,
      contactPhone: data.pickup?.contactPhone || guestInfo?.phone,
    },

    dropoff: {
      address: dropoff.address,
      coords: dropoff.coords,
      lat: dropoff.coords.lat,
      lng: dropoff.coords.lng,
      recipientName: data.dropoff?.recipientName || data.recipientName,
      recipientPhone: data.dropoff?.recipientPhone || data.recipientPhone,
    },

    packageType,

    weightKg: data.weightKg || 1,

    note: data.note || "",

    price: farePrice,

    fare: farePrice,

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

    timeline: [
      {
        status: initialStatus,
        timestamp: new Date(),
        note: isScheduled ? "Delivery scheduled" : "Order placed",
      },
    ],

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
  if (!userId && role !== "rider") {
    return [];
  }

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
    .populate(
      "customer",
      "name phone email avatar"
    )
    .sort({
      createdAt: -1,
    });
};

const getDeliveryById = async (
  userId,
  deliveryId
) => {
  const query = userId
    ? { _id: deliveryId, customer: userId, type: "delivery" }
    : { _id: deliveryId, type: "delivery" };

  const delivery =
    await Delivery.findOne(query).populate(
      "rider",
      "name phone vehicleType vehicleColor plateNumber rating"
    ).populate(
      "customer",
      "name phone email avatar"
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
  const query = userId
    ? { _id: deliveryId, customer: userId, type: "delivery" }
    : { _id: deliveryId, type: "delivery" };

  const delivery = await Delivery.findOne(query);

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

  if (!delivery.timeline) delivery.timeline = [];
  delivery.timeline.push({ status: "cancelled", timestamp: new Date(), note: "Order cancelled" });

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
    })
      .populate(
        "rider",
        "name phone vehicleType vehicleColor plateNumber rating"
      )
      .populate(
        "customer",
        "name phone email avatar"
      );

  if (!delivery) {
    throw new AppError(
      "Delivery not found",
      404
    );
  }

  return delivery;
};

const getDeliveryForRider = async (riderId, deliveryId) => {
  // Rider can fetch deliveries assigned to them.
  const delivery = await Delivery.findOne({
    _id: deliveryId,
    rider: riderId,
    type: "delivery",
  })
    .populate(
      "rider",
      "name phone vehicleType vehicleColor plateNumber rating"
    )
    .populate(
      "customer",
      "name phone email avatar"
    );

  return delivery;
};

export default {
  createDelivery,
  getUserDeliveries,
  getDeliveryById,
  getDeliveryForRider,
  cancelDelivery,
  getDeliveryByTrackingId,
};