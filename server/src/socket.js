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

  // Authenticate every handshake (runs again on each reconnect). An already
  // open socket keeps working past the token's 15-min expiry; only a reconnect
  // after expiry fails, which the client treats as "realtime lost, fall back
  // to REST".
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("unauthorized"));
      const decoded = verifyAccessToken(token);
      socket.user = { id: String(decoded.sub), role: decoded.role };
      return next();
    } catch {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.user;
    socket.join(`user:${id}`);
    if (role) socket.join(`role:${role}`);

    // Chat between a customer and the rider assigned to their order. Only
    // the two participants on that specific order can send/receive — every
    // message is validated against the DB record, never trusted from the
    // payload alone.
    socket.on("chat:send", async ({ orderId, text } = {}, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const trimmed = String(text || "").trim().slice(0, 1000);
        if (!orderId || !trimmed) return reply({ ok: false, error: "A message and order are required" });

        const order = await Delivery.findById(orderId);
        if (!order) return reply({ ok: false, error: "Order not found" });

        const isCustomer = String(order.customer) === id;
        const isRider = order.rider && String(order.rider) === id;
        if (!isCustomer && !isRider) return reply({ ok: false, error: "You are not part of this order" });
        if (!order.rider) return reply({ ok: false, error: "No rider assigned yet" });
        if (["delivered", "cancelled"].includes(order.status)) return reply({ ok: false, error: "This order has ended" });

        const message = {
          sender: id,
          senderRole: isRider ? "rider" : "customer",
          text: trimmed,
          createdAt: new Date(),
        };
        order.messages.push(message);
        await order.save();

        const saved = order.messages[order.messages.length - 1];
        const payload = { orderId: String(order._id), ...saved.toObject() };

        io.to(`user:${String(order.customer)}`).to(`user:${String(order.rider)}`).emit("chat:message", payload);
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
  if (customerId) rooms.add(`user:${customerId}`);
  if (riderId) rooms.add(`user:${riderId}`);
  rooms.add("role:admin");
  extraUserIds.forEach((uid) => {
    const clean = idOf(uid);
    if (clean) rooms.add(`user:${clean}`);
  });
  return [...rooms];
};

export const emitToUser = (userId, event, payload) => {
  const clean = idOf(userId);
  if (!io || !clean) return;
  io.to(`user:${clean}`).emit(event, payload);
};

export const emitToRole = (role, event, payload) => {
  if (!io || !role) return;
  io.to(`role:${role}`).emit(event, payload);
};

/**
 * General "this order changed" — reaches the customer, the assigned rider,
 * every admin, plus any extraUserIds (used to tell a *previous* rider to drop
 * an order that was reassigned away from them). Clients upsert idempotently;
 * this event never triggers a toast.
 */
export const emitOrderUpdate = (order, extraUserIds = []) => {
  if (!io || !order) return;
  io.to(orderRooms(order, extraUserIds)).emit("order:update", order);
};

/** A pending, unassigned job — offered to every rider (no toast). */
export const emitJobAvailable = (order) => {
  if (!io || !order) return;
  io.to("role:rider").emit("job:new", order);
};

/** A job was assigned to a specific rider — the only event that toasts green. */
export const emitJobAssigned = (order) => {
  const riderId = idOf(order?.rider ?? order?.riderId);
  if (!io || !riderId) return;
  io.to(`user:${riderId}`).emit("job:assigned", order);
};
