export function normalizeOrderCustomer(order) {
  if (!order) return { id: 'guest', name: 'Guest Customer', phone: 'N/A', isGuest: true };
  if (order.customer && typeof order.customer === 'object' && order.customer.name) {
    return {
      id: String(order.customer._id || order.customer.id),
      name: order.customer.name,
      phone: order.customer.phone || order.pickup?.contactPhone || 'N/A',
      email: order.customer.email || '',
      avatar: order.customer.avatar || null,
      isGuest: false,
    };
  }
  return {
    id: order.guestInfo?.guestId || order.guestId || 'guest',
    name: order.guestInfo?.name || order.pickup?.contactName || 'Guest Customer',
    phone: order.guestInfo?.phone || order.pickup?.contactPhone || 'N/A',
    email: order.guestInfo?.email || '',
    avatar: null,
    isGuest: true,
  };
}

export async function safeNotifyOrderCustomer({ NotificationModel, order, title, message, io }) {
  const customerId = order?.customer?._id || (typeof order?.customer === 'string' ? order.customer : null);

  if (customerId && NotificationModel) {
    try {
      await NotificationModel.create({
        user: customerId,
        title,
        message,
        type: 'delivery_update',
        referenceId: order._id,
      });
    } catch (_) {}
  }

  if (io && order?._id) {
    const raw = typeof order.toObject === 'function' ? order.toObject() : order;
    const payload = {
      ...raw,
      customerProfile: normalizeOrderCustomer(raw),
      customer: raw.customer || normalizeOrderCustomer(raw),
    };
    io.to(`order_${order._id}`).emit('job_status_updated', payload);
    io.to(`delivery_${order._id}`).emit('delivery_updated', payload);

    if (customerId) {
      io.to(`user_${customerId}`).emit('job_status_updated', payload);
    }
    const guestId = order?.guestInfo?.guestId || order?.guestId;
    if (guestId) {
      io.to(`guest_${guestId}`).emit('job_status_updated', payload);
    }
  }
}
