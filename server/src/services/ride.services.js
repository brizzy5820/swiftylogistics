import Delivery from "../models/Delivery.js";
import Address from "../models/Address.js";
import AppError from "../utils/AppError.js";

const calculateDistance = (a, b) => {
  const R = 6371;

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(
    Math.sqrt(x),
    Math.sqrt(1 - x)
  );
};

const calculateFare = (distanceKm, rideType) => {
  const baseFare = distanceKm * 4;

  const multiplier =
    rideType === "premium"
      ? 1.5
      : rideType === "comfort"
        ? 1.25
        : 1;

  return Math.round(baseFare * multiplier);
};



const createRide = async (userId, data) => {
  let pickup, dropoff
  const scheduledFor = data.scheduledFor
    ? new Date(data.scheduledFor)
    : null;

  if (
    scheduledFor &&
    Number.isNaN(scheduledFor.getTime())
  ) {
    throw new AppError(
      "Invalid scheduled time",
      400
    );
  }

  if (
    scheduledFor &&
    scheduledFor <= new Date()
  ) {
    throw new AppError(
      "Scheduled time must be in the future",
      400
    );
  }

  if (data.pickup && data.dropoff && data.pickup.address && data.dropoff.address) {
    pickup = data.pickup
    dropoff = data.dropoff
  } else {
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

    const pickupCoordinates =
      pickupAddress.coordinates;

    const dropoffCoordinates =
      dropoffAddress.coordinates;

    if (
      !pickupCoordinates ||
      typeof pickupCoordinates.latitude !== "number" ||
      typeof pickupCoordinates.longitude !== "number" ||
      !dropoffCoordinates ||
      typeof dropoffCoordinates.latitude !== "number" ||
      typeof dropoffCoordinates.longitude !== "number"
    ) {
      throw new AppError(
        "Both addresses must have valid coordinates",
        400
      );
    }

    pickup = {
      address: `${pickupAddress.addressLine}, ${pickupAddress.city}, ${pickupAddress.state}`,
      coords: {
        lat: pickupCoordinates.latitude,
        lng: pickupCoordinates.longitude,
      },
    };

    dropoff = {
      address: `${dropoffAddress.addressLine}, ${dropoffAddress.city}, ${dropoffAddress.state}`,
      coords: {
        lat: dropoffCoordinates.latitude,
        lng: dropoffCoordinates.longitude,
      },
    };
  }

  const distanceKm = calculateDistance(
    pickup.coords,
    dropoff.coords
  );

  const price = calculateFare(
    distanceKm,
    data.rideType
  );

  const trackingId =
    `RIDE-${Date.now()
      .toString(36)
      .toUpperCase()}`;

  const initialStatus = scheduledFor
    ? "scheduled"
    : "pending";

  const ride = await Delivery.create({
    customer: userId,

    type: "ride",

    pickup,

    dropoff,

    rideType: data.rideType,

    price,

    distanceKm:
      Math.round(distanceKm * 10) / 10,

    etaMinutes: Math.max(
      5,
      Math.round(distanceKm * 4)
    ),

    status: initialStatus,

    isScheduled: Boolean(scheduledFor),

    scheduledFor,

    trackingId,

    courierPosition: scheduledFor
      ? null
      : pickup.coords,

    statusTimestamps: {
      [initialStatus]: new Date(),
    },
  });

  return ride;
};


const getUserRides = async (userId) => {
  return Delivery.find({
    customer: userId,
    type: "ride",
  })
    .populate(
      "rider",
      "name phone vehicleType vehicleColor plateNumber rating"
    )
    .sort({ createdAt: -1 });
};

const getRideById = async (userId, rideId) => {
  const ride = await Delivery.findOne({
    _id: rideId,
    customer: userId,
    type: "ride",
  }).populate(
    "rider",
    "name phone vehicleType vehicleColor plateNumber rating"
  );

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  return ride;
};

const cancelRide = async (userId, rideId) => {
  const ride = await Delivery.findOne({
    _id: rideId,
    customer: userId,
    type: "ride",
  });

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  if (
    ["delivered", "cancelled"].includes(
      ride.status
    )
  ) {
    throw new AppError(
      "This ride can no longer be cancelled",
      400
    );
  }

  ride.status = "cancelled";

  if (!ride.statusTimestamps) {
    ride.statusTimestamps = new Map();
  }

  ride.statusTimestamps.set(
    "cancelled",
    new Date()
  );

  await ride.save();

  return ride;
};

export default {
  createRide,
  getUserRides,
  getRideById,
  cancelRide,
};