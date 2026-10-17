import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import Delivery from "../models/Delivery.js";
import Notification from "../models/Notification.js";
import notificationService from "./notification.service.js";
import { emitJobAssigned, emitOrderUpdate, emitGuestUpdate } from "../socket.js";

const allowedTransitions = {
  pending: ["accepted", "cancelled"],
  accepted: ["arrived_at_pickup", "picked_up", "cancelled"],
  arrived_at_pickup: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["arrived_at_dropoff", "delivered", "cancelled"],
  arrived_at_dropoff: ["delivered", "cancelled"],
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
  })
    .populate("customer", "name email phone avatar")
    .populate("rider", riderSelect)
    .sort({ createdAt: -1 });
};

const getRiderJob = async (riderId, deliveryId) => {
  const delivery = await Delivery.findOne({
    _id: deliveryId,
    $or: [{ rider: riderId }, { status: "pending", rider: null }],
  })
    .populate("customer", "name email phone avatar")
    .populate("rider", riderSelect);
  if (!delivery) throw new AppError("Job not found", 404);
  return delivery;
};

const updateDeliveryStatus = async (riderId, deliveryId, status) => {
  const delivery = await Delivery.findOne({ _id: deliveryId, rider: riderId });
  if (!delivery) throw new AppError("Delivery not found or not assigned to you", 404);
  const allowedStatuses = allowedTransitions[delivery.status] || [];
  if (!allowedStatuses.includes(status)) throw new AppError(`Cannot change status from ${delivery.status} to ${status}`, 400);

  // "Start trip" (picked_up -> in_transit) is gated for rides: the customer must have
  // confirmed the ride/rider and be on the live track page before the rider
  // is allowed to actually start driving. Deliveries are exempt from this gate.
  if (status === "in_transit" && delivery.type === "ride" && !delivery.customerConfirmed) {
    throw new AppError("Waiting for the customer to confirm before you can start the trip", 400);
  }

  delivery.status = status;
  if (!delivery.statusTimestamps) delivery.statusTimestamps = new Map();
  delivery.statusTimestamps.set(status, new Date());

  if (!delivery.timeline) delivery.timeline = [];
  delivery.timeline.push({ status, timestamp: new Date(), note: `Status updated to ${status.replace(/_/g, ' ')}` });

  if (status === "picked_up" && delivery.pickup?.coords) delivery.courierPosition = delivery.pickup.coords;
  if (status === "delivered" && delivery.dropoff?.coords) delivery.courierPosition = delivery.dropoff.coords;
  if (status === "delivered" || status === "cancelled") delivery.isScheduled = false;

  await delivery.save();

  if (status === "delivered" || status === "cancelled") {
    await User.findByIdAndUpdate(riderId, { isAvailable: true, ...(status === "delivered" ? { $inc: { trips: 1 } } : {}) });
  }

  await delivery.populate("rider", riderSelect);
  if (delivery.customer) {
    await delivery.populate("customer", "name email phone avatar");
  }

  // 1. Guard DB Notification: only if customer is registered (prevents crash on guest order)
  const customerId = delivery.customer?._id || (typeof delivery.customer === "string" ? delivery.customer : null);
  if (customerId) {
    try {
      await notificationService.createNotification({
        userId: customerId,
        type: `order_${status}`,
        title: `Order ${status.replace(/_/g, " ").toUpperCase()}`,
        message: `Your driver updated your order status to ${status.replace(/_/g, " ")}.`,
        deliveryId: delivery._id,
      });
    } catch (_) {}
  }

  // 2. Emit real-time status update to order room, guest room, rider, and user
  emitOrderUpdate(delivery);
  if (delivery.isGuestOrder && delivery.guestInfo?.guestId) {
    emitGuestUpdate(delivery.guestInfo.guestId, delivery);
  }

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
  if (!delivery.statusTimestamps) delivery.statusTimestamps = new Map();
  delivery.statusTimestamps.set("accepted", new Date());

  if (!delivery.timeline) delivery.timeline = [];
  delivery.timeline.push({ status: "accepted", timestamp: new Date(), note: `Accepted by ${rider.name}` });

  if (delivery.pickup?.coords) {
    delivery.courierPosition = delivery.pickup.coords;
  }
  await delivery.save();
  await User.findByIdAndUpdate(riderId, { isAvailable: false });
  await delivery.populate("rider", riderSelect);
  if (delivery.customer) {
    await delivery.populate("customer", "name email phone avatar");
  }

  // 1. Guard DB Notification: only for registered customer
  const customerId = delivery.customer?._id || (typeof delivery.customer === "string" ? delivery.customer : null);
  if (customerId) {
    try {
      await notificationService.createNotification({
        userId: customerId,
        type: "order_accepted",
        title: "Order Accepted",
        message: `${rider.name} has accepted your order.`,
        deliveryId: delivery._id,
      });
    } catch (_) {}
  }

  // 2. Emit real-time status update to order room, guest room, rider, and user
  emitOrderUpdate(delivery);
  emitJobAssigned(delivery);
  if (delivery.isGuestOrder && delivery.guestInfo?.guestId) {
    emitGuestUpdate(delivery.guestInfo.guestId, delivery);
  }

  return delivery;
};

export const updateJobStatus = async ({ jobId, riderId, nextStatus, io }) => {
  const validTransitions = {
    pending: ["accepted"],
    accepted: ["arrived_at_pickup", "picked_up", "cancelled"],
    arrived_at_pickup: ["picked_up", "cancelled"],
    picked_up: ["in_transit", "delivered"],
    in_transit: ["arrived_at_dropoff", "delivered"],
    arrived_at_dropoff: ["delivered"],
  };

  const job = await Delivery.findById(jobId).populate("customer", "name phone email avatar");
  if (!job) throw new AppError("Order not found", 404);

  if (nextStatus === "accepted") {
    if (job.status !== "pending" || job.rider) {
      throw new AppError("Order has already been accepted by another driver", 409);
    }
    job.rider = riderId;
    const rider = await User.findOne({ _id: riderId, role: "rider", isActive: true });
    if (rider) job.riderName = rider.name;
  } else {
    if (String(job.rider) !== String(riderId)) {
      throw new AppError("Unauthorized: You are not assigned to this order", 403);
    }
    const allowed = validTransitions[job.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(`Invalid status transition from ${job.status} to ${nextStatus}`, 400);
    }
  }

  job.status = nextStatus;
  if (!job.timeline) job.timeline = [];
  job.timeline.push({ status: nextStatus, timestamp: new Date() });
  if (!job.statusTimestamps) job.statusTimestamps = new Map();
  job.statusTimestamps.set(nextStatus, new Date());

  if (nextStatus === "picked_up" && job.pickup?.coords) job.courierPosition = job.pickup.coords;
  if (nextStatus === "delivered" && job.dropoff?.coords) job.courierPosition = job.dropoff.coords;
  if (nextStatus === "delivered" || nextStatus === "cancelled") job.isScheduled = false;

  await job.save();

  if (nextStatus === "delivered" || nextStatus === "cancelled") {
    await User.findByIdAndUpdate(riderId, { isAvailable: true, ...(nextStatus === "delivered" ? { $inc: { trips: 1 } } : {}) });
  }

  const populatedJob = await Delivery.findById(job._id)
    .populate("customer", "name phone email avatar")
    .populate("rider", riderSelect);

  // 1. Only create DB Notification if customer is a registered User (Prevents Guest Crash)
  const customerId = populatedJob.customer?._id || (typeof populatedJob.customer === "string" ? populatedJob.customer : null);
  if (customerId) {
    try {
      await notificationService.createNotification({
        userId: customerId,
        type: `order_${nextStatus}`,
        title: `Order ${nextStatus.replace(/_/g, " ").toUpperCase()}`,
        message: `Your driver updated your order status to ${nextStatus.replace(/_/g, " ")}.`,
        deliveryId: populatedJob._id,
      });
    } catch (_) {}
  }

  // 2. Emit real-time update to order room, guest room, rider, and user
  emitOrderUpdate(populatedJob);
  if (populatedJob.isGuestOrder && populatedJob.guestInfo?.guestId) {
    emitGuestUpdate(populatedJob.guestInfo.guestId, populatedJob);
  }

  return populatedJob;
};

export default { getRiderProfile, updateRiderProfile, getRiderJobs, getRiderJob, acceptDelivery, updateDeliveryStatus, updateJobStatus };
