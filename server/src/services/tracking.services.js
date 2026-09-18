import DeliveryTracking from "../models/DeliveryTracking.js";
import Delivery from "../models/Delivery.js";
import AppError from "../utils/AppError.js";
import { emitOrderUpdate } from "../socket.js";

const getTracking = async (userId, deliveryId) => {
  const delivery = await Delivery.findOne({
    _id: deliveryId,
    customer: userId,
  }).populate(
    "rider",
    "name phone vehicleType vehicleColor plateNumber rating"
  );

  if (!delivery) {
    throw new AppError("Delivery not found", 404);
  }

  let tracking = await DeliveryTracking.findOne({
    delivery: deliveryId,
  });

  if (!tracking) {
    tracking = await DeliveryTracking.create({
      delivery: deliveryId,
      status: delivery.status,
      courierPosition: delivery.courierPosition,
      statusTimestamps: delivery.statusTimestamps,
    });
  }

  return {
    trackingId: delivery.trackingId,
    status: delivery.status,
    pickup: delivery.pickup,
    dropoff: delivery.dropoff,
    courierPosition: delivery.courierPosition,
    statusTimestamps: delivery.statusTimestamps,
    rider: delivery.rider,
    price: delivery.price,
    distanceKm: delivery.distanceKm,
    etaMinutes: delivery.etaMinutes,
    customerConfirmed: delivery.customerConfirmed,
  };
};

const getPublicTracking = async (trackingId) => {
  const delivery = await Delivery.findOne({ trackingId }).populate("rider", "name phone vehicleType vehicleColor plateNumber rating");
  if (!delivery) throw new AppError("Delivery not found", 404);
  return { trackingId: delivery.trackingId, id: delivery._id, type: delivery.type, status: delivery.status, pickup: delivery.pickup, dropoff: delivery.dropoff, courierPosition: delivery.courierPosition, statusTimestamps: delivery.statusTimestamps, rider: delivery.rider, riderName: delivery.riderName, price: delivery.price, distanceKm: delivery.distanceKm, etaMinutes: delivery.etaMinutes, createdAt: delivery.createdAt, customerConfirmed: delivery.customerConfirmed };
};

// Called when the customer opens the live track page for an assigned
// ride/delivery. This is the gate a rider's "Start trip" action checks —
// see updateDeliveryStatus in rider.services.js.
const confirmTracking = async (userId, deliveryId) => {
  const delivery = await Delivery.findOne({ _id: deliveryId, customer: userId });
  if (!delivery) throw new AppError("Delivery not found", 404);
  if (!delivery.rider) throw new AppError("No rider has been assigned yet", 400);
  if (!delivery.customerConfirmed) {
    delivery.customerConfirmed = true;
    await delivery.save();
    emitOrderUpdate(delivery);
  }
  return delivery;
};

const getMessages = async (userId, deliveryId) => {
  const delivery = await Delivery.findOne({
    _id: deliveryId,
    $or: [{ customer: userId }, { rider: userId }],
  }).select("messages customer rider");
  if (!delivery) throw new AppError("Delivery not found", 404);
  return delivery.messages || [];
};

export default {
  getTracking,
  getPublicTracking,
  confirmTracking,
  getMessages,
};
