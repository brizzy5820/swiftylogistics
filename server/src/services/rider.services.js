import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import Delivery from "../models/Delivery.js";
const allowedTransitions = {
  pending: ["accepted", "cancelled"],
  accepted: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["delivered"],
};
const getRiderProfile = async (riderId) => {
  const rider = await User.findOne({
    _id: riderId,
    role: "rider",
  }).select("-passwordHash");

  if (!rider) {
    throw new AppError("Rider not found", 404);
  }

  return rider;
};
const findAvailableRider = async (deliveryId) => {
  const delivery = await Delivery.findById(deliveryId);

  if (!delivery) {
    throw new AppError("Delivery not found", 404);
  }

  if (delivery.rider) {
    return delivery.populate(
      "rider",
      "name phone vehicleType vehicleColor plateNumber rating"
    );
  }

  if (delivery.status !== "pending") {
    throw new AppError(
      "Only pending orders can be assigned",
      400
    );
  }

  const rider = await User.findOne({
    role: "rider",
    isAvailable: true,
    isActive: true,
  }).select("-passwordHash");

  if (!rider) {
    return null;
  }

  delivery.rider = rider._id;
  delivery.riderName = rider.name;
  delivery.status = "accepted";

  if (!delivery.statusTimestamps) {
    delivery.statusTimestamps = new Map();
  }

  delivery.statusTimestamps.set(
    "accepted",
    new Date()
  );

  await delivery.save();

  return delivery.populate(
    "rider",
    "name phone vehicleType vehicleColor plateNumber rating"
  );
};
const updateRiderProfile = async (riderId, updates) => {
  const rider = await User.findOneAndUpdate(
    {
      _id: riderId,
      role: "rider",
    },
    updates,
    {
      new: true,
      runValidators: true,
    }
  ).select("-passwordHash");

  if (!rider) {
    throw new AppError("Rider not found", 404);
  }

  return rider;
};
const updateDeliveryStatus = async (
  riderId,
  deliveryId,
  status
) => {
  const delivery = await Delivery.findOne({
    _id: deliveryId,
    $or: [
      { rider: riderId },
      { rider: null, status: "pending", type: { $in: ["delivery", "ride"] } },
    ],
  });

  if (!delivery) {
    throw new AppError(
      "Delivery not found or not assigned to you",
      404
    );
  }

  const allowedStatuses =
    allowedTransitions[delivery.status] || [];

  if (!allowedStatuses.includes(status)) {
    throw new AppError(
      `Cannot change status from ${delivery.status} to ${status}`,
      400
    );
  }

  if (delivery.status === "pending" && status === "accepted") {
    delivery.rider = riderId;
    const rider = await User.findById(riderId).select("name");
    delivery.riderName = rider?.name || null;
  }

  delivery.status = status;

  if (!delivery.statusTimestamps) {
    delivery.statusTimestamps = new Map();
  }

  delivery.statusTimestamps.set(
    status,
    new Date()
  );

  if (status === "picked_up") {
    delivery.courierPosition =
      delivery.pickup.coords;
  }

  if (status === "delivered") {
    delivery.courierPosition =
      delivery.dropoff.coords;

    await User.findByIdAndUpdate(riderId, {
      $inc: { trips: 1 },
    });
  }

  await delivery.save();

  return delivery;
};
export default {
  findAvailableRider,
  getRiderProfile,
  updateRiderProfile,
  updateDeliveryStatus,
};