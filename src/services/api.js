import {
  setDeliveries,
  upsertDelivery,
  setUsers,
  upsertUser,
  setSession,
} from '@/lib/mock-store'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "/api";

export { API_BASE_URL };

const getToken = () => {
  return sessionStorage.getItem("swifty_access_token");
};

const request = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...options.headers,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data;
};

function normalizeUser(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const { _id, ...rest } = raw;
  return { id: String(_id), ...rest };
}

function normalizeDelivery(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const { _id, customer, rider, ...rest } = raw;
  const riderObj = rider && typeof rider === "object" ? rider : null;
  return {
    id: String(_id),
    customerId: customer ? String(customer) : String(rest.customer?._id || ""),
    customerName: rest.customerName || (rest.customer?.name) || "",
    riderId: riderObj ? String(riderObj._id) : rest.riderId || null,
    riderName: riderObj?.name || rest.riderName || null,
    ...rest,
  };
}

function unwrap(data) {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(unwrap);
  if (data.success && data.user) return normalizeUser(data.user);
  if (data.success && data.deliveries) return data.deliveries.map(normalizeDelivery);
  if (data.success && data.delivery) return normalizeDelivery(data.delivery);
  if (data.success && data.address) return data.address;
  if (data.success && data.addresses) return data.addresses.map(normalizeUser);
  if (data.success && data.rider) return normalizeUser(data.rider);
  if (data.success && data.tracking) return data.tracking;
  if (data.success && data.ride) return normalizeDelivery(data.ride);
  if (data.success && data.rides) return data.rides.map(normalizeDelivery);
  if (data.success && data.riders) return data.riders.map(normalizeUser);
  return data;
}

function syncUserToStore(user) {
  if (user && user.id) {
    upsertUser(user)
    setSession({ userId: user.id, role: user.role })
  }
}

function syncDeliveriesToStore(deliveries) {
  if (Array.isArray(deliveries)) {
    setDeliveries(deliveries)
  }
}

/* =========================
   AUTH
   ========================= */

export async function register(payload) {
  const data = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (data.accessToken) {
    sessionStorage.setItem("swifty_access_token", data.accessToken);
  }

  const user = unwrap(data.user || data)
  syncUserToStore(user)

  return data;
}

export async function login(payload) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (data.accessToken) {
    sessionStorage.setItem("swifty_access_token", data.accessToken);
  }

  const user = unwrap(data.user || data)
  syncUserToStore(user)

  return data;
}

export function logout() {
  sessionStorage.removeItem("swifty_access_token");
  setSession(null)
}

/* =========================
   USER
   ========================= */

export async function getMe() {
  const data = await request("/users/me");
  const user = unwrap(data.user || data)
  if (user && user.id) {
    upsertUser(user)
    setSession({ userId: user.id, role: user.role })
  }
  return user;
}

export async function updateMe(payload) {
  const data = await request("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const user = unwrap(data.user || data)
  if (user && user.id) {
    upsertUser(user)
  }
  return user;
}

/* =========================
   ADDRESSES
   ========================= */

export async function getAddresses() {
  return unwrap(await request("/addresses"));
}

export async function getAddress(id) {
  return unwrap(await request(`/addresses/${id}`));
}

export async function createAddress(payload) {
  return unwrap(await request("/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export async function updateAddress(id, payload) {
  return unwrap(await request(`/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }));
}

export async function deleteAddress(id) {
  return unwrap(await request(`/addresses/${id}`, {
    method: "DELETE",
  }));
}

/* =========================
   DELIVERIES
   ========================= */

export async function createDelivery(payload) {
  const data = await request("/deliveries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const delivery = unwrap(data.delivery || data)
  if (delivery && delivery.trackingId) {
    upsertDelivery(delivery)
  }
  return delivery;
}

export async function getDeliveries() {
  const data = await request("/deliveries");
  const deliveries = unwrap(data.deliveries || data)
  syncDeliveriesToStore(deliveries)
  return deliveries
}

export async function getDelivery(id) {
  const data = await request(`/deliveries/${id}`);
  const delivery = unwrap(data.delivery || data)
  if (delivery && delivery.trackingId) {
    upsertDelivery(delivery)
  }
  return delivery;
}

export async function cancelDelivery(id) {
  const data = await request(`/deliveries/${id}/cancel`, {
    method: "PATCH",
  });
  const delivery = unwrap(data.delivery || data)
  if (delivery && delivery.trackingId) {
    upsertDelivery(delivery)
  }
  return delivery;
}

/* =========================
   TRACKING
   ========================= */

export async function getTracking(deliveryId) {
  return unwrap(await request(`/tracking/${deliveryId}`));
}

/* =========================
   RIDER
   ========================= */

export async function getRiderProfile() {
  const data = await request("/riders/me");
  const rider = unwrap(data.rider || data)
  if (rider && rider.id) {
    upsertUser(rider)
  }
  return rider;
}

export async function updateRiderProfile(payload) {
  const data = await request("/riders/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const rider = unwrap(data.rider || data)
  if (rider && rider.id) {
    upsertUser(rider)
  }
  return rider;
}

/* =========================
   RIDES
   ========================= */

export async function createRide(payload) {
  const data = await request("/rides", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const ride = unwrap(data.ride || data)
  if (ride && ride.id) {
    upsertDelivery(ride)
  }
  return ride;
}

export async function getRides() {
  const data = await request("/rides");
  const rides = unwrap(data.rides || data)
  syncDeliveriesToStore(rides)
  return rides
}

export async function getRide(id) {
  const data = await request(`/rides/${id}`);
  const ride = unwrap(data.ride || data)
  if (ride && ride.id) {
    upsertDelivery(ride)
  }
  return ride;
}

export async function cancelRide(id) {
  const data = await request(`/rides/${id}/cancel`, {
    method: "PATCH",
  });
  const ride = unwrap(data.ride || data)
  if (ride && ride.id) {
    upsertDelivery(ride)
  }
  return ride;
}

export async function assignRide(deliveryId) {
  const data = await request(`/riders/assign/${deliveryId}`, {
    method: "POST",
  });
  const ride = unwrap(data.ride || data)
  if (ride && ride.id) {
    upsertDelivery(ride)
  }
  return ride;
}

export async function updateRiderDeliveryStatus(deliveryId, status) {
  const data = await request(`/riders/deliveries/${deliveryId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  const delivery = unwrap(data.delivery || data)
  if (delivery && delivery.trackingId) {
    upsertDelivery(delivery)
  }
  return delivery;
}

/* =========================
   ADMIN
   ========================= */

export async function adminGetDashboard() {
  const data = await request("/admin/dashboard");
  return data.stats || data
}

export async function adminGetUsers(params = {}) {
  const query = new URLSearchParams()
  if (params.role) query.set("role", params.role)
  if (params.search) query.set("search", params.search)
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive))
  const qs = query.toString()
  const data = await request(`/admin/users${qs ? `?${qs}` : ""}`)
  const users = unwrap(data.users || data)
  if (Array.isArray(users)) {
    setUsers(users)
  }
  return users
}

export async function adminGetRiders(params = {}) {
  const query = new URLSearchParams()
  if (params.available !== undefined) query.set("available", String(params.available))
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive))
  const qs = query.toString()
  const data = await request(`/admin/riders${qs ? `?${qs}` : ""}`)
  const riders = unwrap(data.riders || data)
  if (Array.isArray(riders)) {
    setUsers(riders)
  }
  return riders
}

export async function adminGetAvailableRiders() {
  const data = await request("/admin/riders/available")
  const riders = unwrap(data.riders || data)
  if (Array.isArray(riders)) {
    setUsers(riders)
  }
  return riders
}

export async function adminAssignRider(orderId, riderId) {
  const data = await request(`/admin/orders/${orderId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ riderId }),
  })
  const order = unwrap(data.order || data)
  if (order && order.id) {
    upsertDelivery(order)
  }
  return order
}

export async function adminUpdateOrderStatus(orderId, status) {
  const data = await request(`/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
  const order = unwrap(data.order || data)
  if (order && order.id) {
    upsertDelivery(order)
  }
  return order
}