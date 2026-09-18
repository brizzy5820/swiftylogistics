import User from "../models/User.js";
import Delivery from "../models/Delivery.js";
import AppError from "../utils/AppError.js";
import Address from "../models/Address.js";
import Notification from "../models/Notification.js";
import SupportTicket from "../models/SupportTicket.js";
import { emitOrderUpdate, emitJobAssigned } from "../socket.js";

const getDashboardStats = async () => {
  const [
    totalUsers,
    customers,
    riders,
    admins,
    activeUsers,
    availableRiders,
    totalOrders,
    totalDeliveries,
    totalRides,
    pendingOrders,
    scheduledOrders,
    acceptedOrders,
    activeOrders,
    completedOrders,
    cancelledOrders,
    revenueResult,
  ] = await Promise.all([
    User.countDocuments(),

    User.countDocuments({
      role: "customer",
    }),

    User.countDocuments({
      role: "rider",
    }),

    User.countDocuments({
      role: "admin",
    }),

    User.countDocuments({
      isActive: true,
    }),

    User.countDocuments({
      role: "rider",
      isAvailable: true,
      isActive: true,
    }),

    Delivery.countDocuments(),

    Delivery.countDocuments({
      type: "delivery",
    }),

    Delivery.countDocuments({
      type: "ride",
    }),

    Delivery.countDocuments({
      status: "pending",
    }),

    Delivery.countDocuments({
      status: "scheduled",
    }),

    Delivery.countDocuments({
      status: "accepted",
    }),

    Delivery.countDocuments({
      status: {
        $in: [
          "accepted",
          "picked_up",
          "in_transit",
        ],
      },
    }),

    Delivery.countDocuments({
      status: "delivered",
    }),

    Delivery.countDocuments({
      status: "cancelled",
    }),

    Delivery.aggregate([
      {
        $match: {
          status: "delivered",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$price",
          },
        },
      },
    ]),
  ]);

  return {
    users: {
      total: totalUsers,
      customers,
      riders,
      admins,
      active: activeUsers,
    },

    riders: {
      total: riders,
      available: availableRiders,
    },

    orders: {
      total: totalOrders,
      deliveries: totalDeliveries,
      rides: totalRides,
      pending: pendingOrders,
      scheduled: scheduledOrders,
      accepted: acceptedOrders,
      active: activeOrders,
      completed: completedOrders,
      cancelled: cancelledOrders,
    },

    revenue: {
      total: revenueResult[0]?.total || 0,
    },
  };
};

const getUsers = async ({
  role,
  isActive,
  search,
}) => {
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (typeof isActive === "boolean") {
    filter.isActive = isActive;
  }

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  return User.find(filter)
    .select("-passwordHash")
    .sort({
      createdAt: -1,
    });
};

const getUserById = async (
  userId
) => {
  const user = await User.findById(userId)
    .select("-passwordHash");

  if (!user) {
    throw new AppError(
      "User not found",
      404
    );
  }

  return user;
};

const updateUser = async (
  userId,
  updates,
  adminId
) => {
  if (userId.toString() === adminId.toString() && (updates.isActive === false || updates.role)) {
    throw new AppError("You cannot deactivate or change the role of your own account", 400);
  }

  const user =
    await User.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).select("-passwordHash");

  if (!user) {
    throw new AppError(
      "User not found",
      404
    );
  }

  return user;
};

const updateUserRole = async (
  userId,
  role,
  adminId
) => {
  if (
    userId.toString() ===
    adminId.toString()
  ) {
    throw new AppError(
      "You cannot change your own role",
      400
    );
  }

  const user =
    await User.findByIdAndUpdate(
      userId,
      { role },
      {
        new: true,
        runValidators: true,
      }
    ).select("-passwordHash");

  if (!user) {
    throw new AppError(
      "User not found",
      404
    );
  }

  return user;
};

const updateUserStatus = async (
  userId,
  isActive,
  adminId
) => {
  if (
    userId.toString() ===
    adminId.toString() &&
    isActive === false
  ) {
    throw new AppError(
      "You cannot deactivate your own account",
      400
    );
  }

  const user =
    await User.findByIdAndUpdate(
      userId,
      { isActive },
      {
        new: true,
      }
    ).select("-passwordHash");

  if (!user) {
    throw new AppError(
      "User not found",
      404
    );
  }

  return user;
};

const getRiders = async ({
  available,
  isActive,
}) => {
  const filter = {
    role: "rider",
  };

  if (typeof available === "boolean") {
    filter.isAvailable = available;
  }

  if (typeof isActive === "boolean") {
    filter.isActive = isActive;
  }

  return User.find(filter)
    .select("-passwordHash")
    .sort({
      createdAt: -1,
    });
};

const getRiderById = async (
  riderId
) => {
  const rider = await User.findOne({
    _id: riderId,
    role: "rider",
  }).select("-passwordHash");

  if (!rider) {
    throw new AppError(
      "Rider not found",
      404
    );
  }

  return rider;
};

const getAllOrders = async ({
  type,
  status,
  riderId,
}) => {
  const filter = {};

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  if (riderId) {
    filter.rider = riderId;
  }

  return Delivery.find(filter)
    .populate(
      "customer",
      "name email phone"
    )
    .populate(
      "rider",
      "name phone vehicleType vehicleColor plateNumber rating isAvailable"
    )
    .sort({
      createdAt: -1,
    });
};

const getOrderById = async (
  orderId
) => {
  const order =
    await Delivery.findById(orderId)
      .populate(
        "customer",
        "name email phone"
      )
      .populate(
        "rider",
        "name phone vehicleType vehicleColor plateNumber rating isAvailable"
      );

  if (!order) {
    throw new AppError(
      "Order not found",
      404
    );
  }

  return order;
};

const findAvailableRiders = async () => {
  return User.find({
    role: "rider",
    isAvailable: true,
    isActive: true,
  })
    .select(
      "name phone vehicleType vehicleColor plateNumber rating trips isAvailable"
    )
    .sort({
      rating: -1,
      trips: 1,
    });
};

const assignRider = async (
  orderId,
  riderId
) => {
  const order =
    await Delivery.findById(orderId);

  if (!order) {
    throw new AppError(
      "Order not found",
      404
    );
  }

  if (
    ["delivered", "cancelled"].includes(
      order.status
    )
  ) {
    throw new AppError(
      "This order can no longer be assigned",
      400
    );
  }

  const rider =
    await User.findOne({
      _id: riderId,
      role: "rider",
      isActive: true,
    });

  if (!rider) {
    throw new AppError(
      "Rider not found or inactive",
      404
    );
  }

  order.rider = rider._id;
  order.riderName = rider.name;

  if (
    order.status === "pending"
  ) {
    order.status = "accepted";
  }

  if (!order.statusTimestamps) {
    order.statusTimestamps =
      new Map();
  }

  order.statusTimestamps.set(
    "accepted",
    new Date()
  );

  if (!order.courierPosition) {
    order.courierPosition =
      order.pickup.coords;
  }

  await order.save();

  await order.populate(
    "rider",
    "name phone vehicleType vehicleColor plateNumber rating isAvailable"
  );

  emitOrderUpdate(order);
  emitJobAssigned(order);

  return order;
};

const autoAssignRider = async (
  orderId
) => {
  const order =
    await Delivery.findById(orderId);

  if (!order) {
    throw new AppError(
      "Order not found",
      404
    );
  }

  if (
    order.rider
  ) {
    return order.populate(
      "rider",
      "name phone vehicleType vehicleColor plateNumber rating isAvailable"
    );
  }

  if (
    !["pending"].includes(
      order.status
    )
  ) {
    throw new AppError(
      "Only pending orders can be assigned",
      400
    );
  }

  const rider =
    await User.findOne({
      role: "rider",
      isAvailable: true,
      isActive: true,
    })
      .sort({
        rating: -1,
        trips: 1,
      });

  if (!rider) {
    throw new AppError(
      "No available rider found",
      404
    );
  }

  return assignRider(
    orderId,
    rider._id
  );
};

const updateOrderStatus = async (
  orderId,
  status
) => {
  const order =
    await Delivery.findById(orderId);

  if (!order) {
    throw new AppError(
      "Order not found",
      404
    );
  }

  if (
    order.status === status
  ) {
    throw new AppError(
      `Order is already ${status}`,
      400
    );
  }

  if (
    ["delivered", "cancelled"].includes(
      order.status
    )
  ) {
    throw new AppError(
      "Completed or cancelled orders cannot be changed",
      400
    );
  }

  order.status = status;

  if (!order.statusTimestamps) {
    order.statusTimestamps =
      new Map();
  }

  order.statusTimestamps.set(
    status,
    new Date()
  );

  if (
    status === "accepted" &&
    order.rider
  ) {
    const rider =
      await User.findById(
        order.rider
      );

    if (rider) {
      order.riderName =
        rider.name;
    }
  }

  if (
    status === "picked_up"
  ) {
    order.courierPosition =
      order.pickup.coords;
  }

  if (
    status === "delivered"
  ) {
    order.courierPosition =
      order.dropoff.coords;

    if (order.rider) {
      await User.findByIdAndUpdate(
        order.rider,
        {
          $inc: {
            trips: 1,
          },
        }
      );
    }
  }

  if (
    status === "cancelled"
  ) {
    order.isScheduled = false;
  }

  await order.save();

  emitOrderUpdate(order);

  return order;
};

const cancelOrder = async (
  orderId
) => {
  return updateOrderStatus(
    orderId,
    "cancelled"
  );
};

const getRecentOrders = async (
  limit = 10
) => {
  return Delivery.find()
    .populate(
      "customer",
      "name email"
    )
    .populate(
      "rider",
      "name phone vehicleType plateNumber"
    )
    .sort({
      createdAt: -1,
    })
    .limit(Number(limit));
};


const createUser = async (data) => {
  const { name, email, password, phone, role = "customer", department, ...details } = data;
  const normalizedEmail = email.toLowerCase().trim();
  if (await User.findOne({ email: normalizedEmail })) throw new AppError("An account with this email already exists", 409);
  const bcrypt = (await import("bcrypt")).default;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: normalizedEmail, passwordHash, phone, role, department, ...details });
  return User.findById(user._id).select("-passwordHash");
};

const deleteUser = async (userId, adminId) => {
  if (String(userId) === String(adminId)) throw new AppError("You cannot delete your own account", 400);
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw new AppError("User not found", 404);
  await Promise.all([
    Address.deleteMany({ user: userId }),
    Notification.deleteMany({ user: userId }),
    SupportTicket.deleteMany({ customer: userId }),
    Delivery.deleteMany({ $or: [{ customer: userId }, { rider: userId }] }),
  ]);
  return user;
};


const setUserPassword = async (userId, password) => {
  if (!password || password.length < 8) throw new AppError("Password must be at least 8 characters", 400);
  const bcrypt = (await import("bcrypt")).default;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findByIdAndUpdate(userId, { passwordHash }, { new: true }).select("-passwordHash");
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const deleteOrder = async (orderId) => {
  const order = await Delivery.findByIdAndDelete(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.rider) await User.findByIdAndUpdate(order.rider, { isAvailable: true });
  emitOrderUpdate({ ...order.toObject(), status: "cancelled" });
  return order;
};

const resetOrder = async (orderId) => {
  const order = await Delivery.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.status === "delivered") throw new AppError("Delivered orders cannot be reset", 400);
  if (order.rider) await User.findByIdAndUpdate(order.rider, { isAvailable: true });
  order.rider = null; order.riderName = null; order.status = "pending"; order.isScheduled = false; order.courierPosition = order.pickup.coords;
  if (!order.statusTimestamps) order.statusTimestamps = new Map();
  order.statusTimestamps.set("pending", new Date());
  await order.save();
  emitOrderUpdate(order);
  return order;
};

export default {
  getDashboardStats,

  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserStatus,
  createUser,
  deleteUser,
  setUserPassword,

  getRiders,
  getRiderById,
  findAvailableRiders,

  getAllOrders,
  getOrderById,
  getRecentOrders,

  assignRider,
  autoAssignRider,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  resetOrder,
};