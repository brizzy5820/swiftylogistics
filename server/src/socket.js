import { Server } from "socket.io";
import { verifyAccessToken } from "./utils/jwt.js";
import Delivery from "./models/Delivery.js";

let io = null;

/**
 * Boot the realtime layer on top of the existing HTTP server.
 * Socket.IO needs its OWN cors config — the Express `cors()` middleware does
 * not cover the engine.io handshake.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Authenticate handshake if token is present; allow anonymous/guest customers
  // to connect so they can track orders in real time.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          socket.user = { id: String(decoded.sub), role: decoded.role };
          return next();
        } catch {
          // Token expired or invalid — fallback to guest if guestId provided
          const guestId = socket.handshake.auth?.guestId || socket.handshake.query?.guestId;
          socket.guestId = guestId ? String(guestId) : null;
          return next();
        }
      }

      // Guest / unauthenticated connection
      const guestId = socket.handshake.auth?.guestId || socket.handshake.query?.guestId;
      socket.guestId = guestId ? String(guestId) : null;
      return next();
    } catch {
      return next();
    }
  });

  io.on("connection", (socket) => {
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
      socket.join(`user_${socket.user.id}`);
    }
    if (socket.user?.role) {
      socket.join(`role:${socket.user.role}`);
    }
    if (socket.guestId) {
      socket.join(`guest-${socket.guestId}`);
      socket.join(`guest_${socket.guestId}`);
    }

    // Explicit room subscription events
    socket.on("join:order", (orderId) => {
      if (orderId) {
        socket.join(`order-${orderId}`);
        socket.join(`order_${orderId}`);
      }
    });

    socket.on("leave:order", (orderId) => {
      if (orderId) {
        socket.leave(`order-${orderId}`);
        socket.leave(`order_${orderId}`);
      }
    });

    socket.on("join:guest", (guestId) => {
      if (guestId) {
        socket.join(`guest-${guestId}`);
        socket.join(`guest_${guestId}`);
      }
    });

    socket.on("leave:guest", (guestId) => {
      if (guestId) {
        socket.leave(`guest-${guestId}`);
        socket.leave(`guest_${guestId}`);
      }
    });

    // Chat between a customer (registered or guest) and the rider assigned to their order.
    socket.on("chat:send", async ({ orderId, text } = {}, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const trimmed = String(text || "").trim().slice(0, 1000);
        if (!orderId || !trimmed) return reply({ ok: false, error: "A message and order are required" });

        const order = await Delivery.findById(orderId);
        if (!order) return reply({ ok: false, error: "Order not found" });

        const userId = socket.user?.id;
        const isCustomer = userId && String(order.customer) === userId;
        const isRider = order.rider && userId && String(order.rider) === userId;
        const isGuestCustomer = !order.customer && (
          socket.guestId === order.guestInfo?.guestId ||
          !socket.user?.id
        );

        if (!isCustomer && !isRider && !isGuestCustomer) {
          return reply({ ok: false, error: "You are not part of this order" });
        }
        if (!order.rider) return reply({ ok: false, error: "No rider assigned yet" });
        if (["delivered", "cancelled"].includes(order.status)) return reply({ ok: false, error: "This order has ended" });

        const senderRole = isRider ? "rider" : "customer";
        const senderId = userId || order.guestInfo?.guestId || "guest";

        const message = {
          sender: userId || order.rider, // ObjectId for schema if present
          senderRole,
          text: trimmed,
          createdAt: new Date(),
        };
        if (!order.messages) order.messages = [];
        order.messages.push(message);
        await order.save();

        const saved = order.messages[order.messages.length - 1];
        const payload = {
          orderId: String(order._id),
          sender: senderId,
          senderRole,
          text: trimmed,
          createdAt: saved.createdAt || new Date(),
        };

        // Emit to rider user room, order rooms, and guest room
        if (order.rider) io.to(`user:${String(order.rider)}`).to(`user_${String(order.rider)}`).emit("chat:message", payload);
        if (order.customer) io.to(`user:${String(order.customer)}`).to(`user_${String(order.customer)}`).emit("chat:message", payload);
        io.to(`order-${String(order._id)}`).to(`order_${String(order._id)}`).emit("chat:message", payload);
        if (order.guestInfo?.guestId) {
          io.to(`guest-${order.guestInfo.guestId}`).to(`guest_${order.guestInfo.guestId}`).emit("chat:message", payload);
        }

        reply({ ok: true, message: payload });
      } catch (error) {
        reply({ ok: false, error: "Unable to send message" });
      }
    });
  });

  return io;
};

export const getIO = () => io;

const idOf = (value) => {
  if (!value) return null;
  if (typeof value === "object") return String(value._id || value.id || value);
  return String(value);
};

const orderRooms = (order, extraUserIds = []) => {
  const rooms = new Set();
  const customerId = idOf(order?.customer ?? order?.customerId);
  const riderId = idOf(order?.rider ?? order?.riderId);
  if (customerId) {
    rooms.add(`user:${customerId}`);
    rooms.add(`user_${customerId}`);
  }
  if (riderId) {
    rooms.add(`user:${riderId}`);
    rooms.add(`user_${riderId}`);
  }
  rooms.add("role:admin");
  extraUserIds.forEach((uid) => {
    const clean = idOf(uid);
    if (clean) {
      rooms.add(`user:${clean}`);
      rooms.add(`user_${clean}`);
    }
  });
  return [...rooms];
};

export const emitToUser = (userId, event, payload) => {
  const clean = idOf(userId);
  if (!io || !clean) return;
  io.to(`user:${clean}`).to(`user_${clean}`).emit(event, payload);
};

export const emitToRole = (role, event, payload) => {
  if (!io || !role) return;
  io.to(`role:${role}`).emit(event, payload);
};

/**
 * General "this order changed" — reaches the order room, guest room,
 * the customer, the assigned rider, every admin, plus any extraUserIds.
 */
export const emitOrderUpdate = (order, extraUserIds = []) => {
  if (!io || !order) return;
  const raw = typeof order.toObject === "function" ? order.toObject({ virtuals: true }) : order;
  const orderId = idOf(raw._id || raw.id);
  const rooms = new Set(orderRooms(raw, extraUserIds));

  if (orderId) {
    rooms.add(`order-${orderId}`);
    rooms.add(`order_${orderId}`);
  }

  const guestId = raw.guestInfo?.guestId || raw.guestId;
  if (guestId) {
    rooms.add(`guest-${guestId}`);
    rooms.add(`guest_${guestId}`);
  }

  const targetRooms = [...rooms];
  io.to(targetRooms).emit("order:update", raw);
  io.to(targetRooms).emit("job_status_updated", raw);
  io.to(targetRooms).emit("delivery_updated", raw);
};

/**
 * Emits an update directly to a guest session room.
 */
export const emitGuestUpdate = (guestId, data) => {
  if (!io || !guestId) return;
  const raw = typeof data?.toObject === "function" ? data.toObject({ virtuals: true }) : data;
  io.to(`guest-${guestId}`).to(`guest_${guestId}`).emit("order:update", raw);
  io.to(`guest-${guestId}`).to(`guest_${guestId}`).emit("job_status_updated", raw);
  io.to(`guest-${guestId}`).to(`guest_${guestId}`).emit("delivery_updated", raw);
};

/** A pending, unassigned job — offered to every rider (no toast). */
export const emitJobAvailable = (order) => {
  if (!io || !order) return;
  const raw = typeof order.toObject === "function" ? order.toObject({ virtuals: true }) : order;
  io.to("role:rider").emit("job:new", raw);
};

/** A job was assigned to a specific rider. */
export const emitJobAssigned = (order) => {
  const riderId = idOf(order?.rider ?? order?.riderId);
  if (!io || !riderId) return;
  const raw = typeof order.toObject === "function" ? order.toObject({ virtuals: true }) : order;
  io.to(`user:${riderId}`).to(`user_${riderId}`).emit("job:assigned", raw);
};
