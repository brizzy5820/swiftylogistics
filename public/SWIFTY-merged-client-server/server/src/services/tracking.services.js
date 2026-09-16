import DeliveryTracking from "../models/DeliveryTracking.js";
import Delivery from "../models/Delivery.js";
import AppError from "../utils/AppError.js";

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
  };
};

const getPublicTracking = async (trackingId) => {
  const delivery = await Delivery.findOne({ trackingId }).populate("rider", "name phone vehicleType vehicleColor plateNumber rating");
  if (!delivery) throw new AppError("Delivery not found", 404);
  return { trackingId: delivery.trackingId, id: delivery._id, type: delivery.type, status: delivery.status, pickup: delivery.pickup, dropoff: delivery.dropoff, courierPosition: delivery.courierPosition, statusTimestamps: delivery.statusTimestamps, rider: delivery.rider, riderName: delivery.riderName, price: delivery.price, distanceKm: delivery.distanceKm, etaMinutes: delivery.etaMinutes, createdAt: delivery.createdAt };
};

export default {
  getTracking,
  getPublicTracking,
};