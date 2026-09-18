import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import Delivery from "../models/Delivery.js";
import { emitJobAssigned, emitOrderUpdate } from "../socket.js";

const allowedTransitions = {
  pending: ["accepted", "cancelled"],
  accepted: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["delivered"],
};

const riderSelect = "name phone vehicleType vehicleColor plateNumber rating trips isAvailable isActive";

const getRiderProfile = async (riderId) => {
  const rider = await User.findOne({ _id: riderId, role: "rider" }).select("-passwordHash");
  if (!rider) throw new AppError("Rider not found", 404);
  return rider;
};

const updateRiderProfile = async (riderId, updates) => {
  const rider = await User.findOneAndUpdate({ _id: riderId, role: "rider" }, updates, { new: true, runValidators: true }).select("-passwordHash");
  if (!rider) throw new AppError("Rider not found", 404);
  return rider;
};

const getRiderJobs = async (riderId) => {
  return Delivery.find({
    $or: [
      { rider: riderId },
      { status: "pending", rider: null },
    ],
  }).populate("customer", "name email phone").populate("rider", riderSelect).sort({ createdAt: -1 });
};

const getRiderJob = async (riderId, deliveryId) => {
  const delivery = await Delivery.findOne({ _id: deliveryId, $or: [{ rider: riderId }, { status: "pending", rider: null }] })
    .populate("customer", "name email phone")
    .populate("rider", riderSelect);
  if (!delivery) throw new AppError("Job not found", 404);
  return delivery;
};

const updateDeliveryStatus = async (riderId, deliveryId, status) => {
  const delivery = await Delivery.findOne({ _id: deliveryId, rider: riderId });
  if (!delivery) throw new AppError("Delivery not found or not assigned to you", 404);
  const allowedStatuses = allowedTransitions[delivery.status] || [];
  if (!allowedStatuses.includes(status)) throw new AppError(`Cannot change status from ${delivery.status} to ${status}`, 400);

  // "Start trip" (picked_up -> in_transit) is gated: the customer must have
  // confirmed the ride/rider and be on the live track page before the rider
  // is allowed to actually start driving. Deliveries (no live customer
  // presence expected) are exempt from this gate.
  if (status === "in_transit" && delivery.type === "ride" && !delivery.customerConfirmed) {
    throw new AppError("Waiting for the customer to confirm before you can start the trip", 400);
  }

  delivery.status = status;
  if (!delivery.statusTimestamps) delivery.statusTimestamps = new Map();
  delivery.statusTimestamps.set(status, new Date());

  if (status === "picked_up") delivery.courierPosition = delivery.pickup.coords;
  if (status === "delivered") delivery.courierPosition = delivery.dropoff.coords;
  if (status === "delivered" || status === "cancelled") delivery.isScheduled = false;

  await delivery.save();

  if (status === "delivered" || status === "cancelled") {
    await User.findByIdAndUpdate(riderId, { isAvailable: true, ...(status === "delivered" ? { $inc: { trips: 1 } } : {}) });
  }

  await delivery.populate("rider", riderSelect);
  emitOrderUpdate(delivery);
  return delivery;
};

const acceptDelivery = async (riderId, deliveryId) => {
  const delivery = await Delivery.findOne({ _id: deliveryId, status: "pending", rider: null });
  if (!delivery) throw new AppError("Job is no longer available", 404);
  delivery.rider = riderId;
  const rider = await User.findOne({ _id: riderId, role: "rider", isActive: true });
  if (!rider) throw new AppError("Rider not found", 404);
  delivery.riderName = rider.name;
  delivery.status = "accepted";
  delivery.customerConfirmed = false;
  delivery.statusTimestamps.set("accepted", new Date());
  delivery.courierPosition = delivery.pickup.coords;
  await delivery.save();
  await User.findByIdAndUpdate(riderId, { isAvailable: false });
  await delivery.populate("rider", riderSelect);
  emitOrderUpdate(delivery);
  emitJobAssigned(delivery);
  return delivery;
};

export default { getRiderProfile, updateRiderProfile, getRiderJobs, getRiderJob, acceptDelivery, updateDeliveryStatus };
