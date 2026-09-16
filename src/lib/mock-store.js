import { useEffect, useState, useRef } from 'react'

const STORAGE_KEY = 'swifty-store-v1'
const SESSION_KEY = 'swifty-session'

export const VEHICLE_TYPES = ['Bike', 'Car', 'Van']

const LAGOS = { lat: 6.5244, lng: 3.3792 }
const offset = (base, dLat, dLng) => ({ lat: base.lat + dLat, lng: base.lng + dLng })

// Generate unique tracking IDs
function generateTrackingId() {
  return 'TRK-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase()
}

function distance(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function seedDeliveries() {
  const base = LAGOS
  const make = (
    id,
    status,
    pickupAddr,
    dropAddr,
    p,
    d,
    pkg,
    customerName = 'Amina Okafor',
    customerId = 'u-cust-1',
  ) => {
    const km = distance(p, d)
    const createdAt = Date.now() - Math.random() * 86400000
    const ORDER = ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered']
    const reached = (s) => ORDER.indexOf(status) >= ORDER.indexOf(s)
    const statusTimestamps = {
      pending: createdAt,
      ...(reached('accepted')  ? { accepted:  createdAt + 2  * 60000 } : {}),
      ...(reached('picked_up') ? { picked_up: createdAt + 7  * 60000 } : {}),
      ...(reached('in_transit')? { in_transit:createdAt + 10 * 60000 } : {}),
      ...(reached('delivered') ? { delivered: createdAt + 25 * 60000 } : {}),
    }
    return {
      id,
      trackingId: generateTrackingId(),
      customerId,
      customerName,
      pickup: { address: pickupAddr, coords: p },
      dropoff: { address: dropAddr, coords: d },
      packageType: pkg,
      price: Math.round(km * 3 + (pkg === 'Cargo' ? 8 : pkg === 'Express' ? 4 : 2)),
      distanceKm: Math.round(km * 10) / 10,
      status,
      createdAt,
      statusTimestamps,
      etaMinutes: Math.max(5, Math.round(km * 4)),
      courierPosition: status === 'in_transit' || status === 'picked_up' ? p : undefined,
    }
  }
  return [
    make('DP-9021', 'in_transit', 'Lekki Phase 1', 'Victoria Island', offset(base, 0.02, 0.04), offset(base, -0.01, 0.01), 'Express', 'Amina Okafor', 'u-cust-1'),
    make('DP-8829', 'delivered', 'Ikeja City Mall', 'Yaba Tech', offset(base, 0.08, -0.05), offset(base, 0.04, -0.02), 'Cargo', 'Amina Okafor', 'u-cust-1'),
    make('DP-7710', 'pending', 'Surulere', 'Ikoyi', offset(base, 0.03, -0.04), offset(base, -0.005, 0.02), 'Express'),
    make('DP-7702', 'pending', 'Pharmacy Plus, Maryland', 'Magodo Estate', offset(base, 0.06, 0.01), offset(base, 0.08, 0.04), 'Express'),
    make('DP-7698', 'pending', 'Computer Village', 'Lekki Phase 2', offset(base, 0.075, -0.045), offset(base, 0.015, 0.06), 'Cargo'),
  ]
}

function defaultStore() {
  return {
    users: [],
    deliveries: [],
    session: null,
    supportTickets: [],
    scheduled: [],
  }
}


function generateUid() {
  return `UID-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
}

let store = defaultStore()
let hydrated = false
const listeners = new Set()
let autoAdvanceTimer = null

// ── Global courier auto-advance ──────────────────────────────────────
// Continues moving the courier marker for any in_transit delivery at a
// steady rate, so all open maps stay in sync regardless of which page
// the rider or customer is currently viewing.
function ensureAutoAdvance() {
  if (autoAdvanceTimer) return
  autoAdvanceTimer = setInterval(() => {
    let changed = false
    store.deliveries = store.deliveries.map((d) => {
      if (d.status !== 'in_transit' || !d.courierPosition) return d
      const currentFrac = d._frac ?? 0
      if (currentFrac >= 1) return d
      const nextFrac = Math.min(currentFrac + 0.02, 1)
      changed = true
      const p = d.pickup.coords
      const q = d.dropoff.coords
      return {
        ...d,
        _frac: nextFrac,
        courierPosition: {
          lat: p.lat + (q.lat - p.lat) * nextFrac,
          lng: p.lng + (q.lng - p.lng) * nextFrac,
        },
      }
    })
    if (changed) emitSilent()
  }, 1500)
}

function stopAutoAdvance() {
  if (!autoAdvanceTimer) return
  clearInterval(autoAdvanceTimer)
  autoAdvanceTimer = null
}

function persist() {
  if (typeof window === 'undefined') return
  try {
    const { session, ...data } = store
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    if (session) {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      window.sessionStorage.removeItem(SESSION_KEY)
    }
  } catch {}
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  window.localStorage.removeItem(STORAGE_KEY)
  try {
    const rawSession = window.sessionStorage.getItem(SESSION_KEY)
    if (rawSession) store.session = JSON.parse(rawSession)
  } catch {}
  // Backfill UIDs for any existing users that predate this field.
  store.users = store.users.map((u) => u.uid ? u : { ...u, uid: u.uid || generateUid() })
  // Resume courier auto-advance if any trip was in transit at the time
  // the page last shut down.
  if (store.deliveries.some((d) => d.status === 'in_transit')) {
    ensureAutoAdvance()
  }
}

function emit() {
  persist()
  listeners.forEach((l) => l())
}

// Lightweight emit that skips localStorage — used for rapid courier position updates
function emitSilent() {
  listeners.forEach((l) => l())
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function getStore() {
  hydrate()
  return store
}

export function useStore(selector) {
  hydrate()
  const selectorRef = useRef(selector)
  const [value, setValue] = useState(() => selector(store))

  useEffect(() => {
    selectorRef.current = selector
  }, [selector])

  useEffect(() => {
    const update = () => {
      const nextValue = selectorRef.current(store)
      setValue((prevValue) => (Object.is(prevValue, nextValue) ? prevValue : nextValue))
    }
    update()
    return subscribe(update)
  }, [])

  return value
}

export function emailExists(email) {
  hydrate()
  if (!email) return false
  return store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function signIn(email, password) {
  hydrate()
  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user || user.password !== password) return null
  store.session = { userId: user.id, role: user.role }
  emit()
  return user
}

export function signUp(name, email, role, details = {}) {
  hydrate()
  const user = {
    id: `u-${Math.random().toString(36).slice(2, 8)}`,
    uid: generateUid(),
    name,
    email,
    role,
    password: details.password,
    phone: details.phone,
    createdAt: Date.now(),
    ...(role === 'rider'
      ? {
          rating: 5,
          trips: 0,
          vehicleType: details.vehicleType,
          vehicleColor: details.vehicleColor,
          plateNumber: details.plateNumber,
          licenseNumber: details.licenseNumber,
          nin: details.nin,
          bankName: details.bankName,
          accountNumber: details.accountNumber,
        }
      : {}),
  }
  store.users = [...store.users, user]
  store.session = { userId: user.id, role }
  emit()
  return user
}

export function signOut() {
  store.session = null
  if (typeof window !== 'undefined') {
    const token = window.sessionStorage.getItem('swifty_access_token')
    if (token) {
      fetch('/api/riders/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isAvailable: false }),
      }).catch(() => null)
    }
    window.sessionStorage.removeItem('swifty_access_token')
  }
  emit()
}

export function getCurrentUser() {
  hydrate()
  if (!store.session) return null
  return store.users.find((u) => u.id === store.session.userId) ?? null
}

export function setAuthenticatedUser(user) {
  hydrate()
  if (!user?.id) return null

  const existing = store.users.find((item) => item.id === String(user.id))
  const nextUser = {
    ...(existing ?? {}),
    ...user,
    id: String(user.id),
  }

  store.users = existing
    ? store.users.map((item) => item.id === nextUser.id ? nextUser : item)
    : [...store.users, nextUser]
  store.session = { userId: nextUser.id, role: nextUser.role }
  emit()
  return nextUser
}

export function upsertDelivery(delivery) {
  hydrate()
  if (!delivery?.id) return null

  const existing = store.deliveries.some((item) => item.id === delivery.id)
  store.deliveries = existing
    ? store.deliveries.map((item) => item.id === delivery.id ? { ...item, ...delivery } : item)
    : [delivery, ...store.deliveries]
  emit()
  return delivery
}

export function upsertDeliveries(deliveries) {
  hydrate()
  if (!Array.isArray(deliveries)) return []

  const incoming = new Map(deliveries.filter((delivery) => delivery?.id).map((delivery) => [delivery.id, delivery]))
  store.deliveries = [
    ...incoming.values(),
    ...store.deliveries.filter((delivery) => !incoming.has(delivery.id)),
  ]
  emit()
  return deliveries
}

export function upsertUsers(users) {
  hydrate()
  if (!Array.isArray(users)) return []
  const incoming = new Map(users.filter((user) => user?.id).map((user) => [user.id, user]))
  store.users = [
    ...store.users.map((user) => incoming.get(user.id) ?? user),
    ...users.filter((user) => user?.id && !store.users.some((item) => item.id === user.id)),
  ]
  emit()
  return users
}

export function updateCurrentUser(updates) {
  hydrate()
  if (!store.session) return null
  let updatedUser = null
  store.users = store.users.map((user) => {
    if (user.id !== store.session.userId) return user
    updatedUser = { ...user, ...updates }
    return updatedUser
  })
  emit()
  return updatedUser
}

export function createDelivery(input) {
  const km = distance(input.pickup.coords, input.dropoff.coords)
  const d = {
    id: `DP-${Math.floor(1000 + Math.random() * 9000)}`,
    trackingId: generateTrackingId(),
    customerId: input.customerId,
    customerName: input.customerName,
    pickup: input.pickup,
    dropoff: input.dropoff,
    packageType: input.packageType,
    weightKg: input.weightKg,
    note: input.note,
    price: Math.round(km * 3 + (input.packageType === 'Cargo' ? 8 : input.packageType === 'Express' ? 4 : 2)),
    distanceKm: Math.round(km * 10) / 10,
    status: 'pending',
    createdAt: Date.now(),
    statusTimestamps: { pending: Date.now() },
    etaMinutes: Math.max(5, Math.round(km * 4)),
    _frac: 0,
  }
  store.deliveries = [d, ...store.deliveries]
  emit()
  return d
}

// Schedule a delivery for a future date/time. Returns a `scheduled`
// record that the customer can see in their upcoming list and the
// rider can claim when the time arrives.
export function scheduleDelivery(input) {
  const km = distance(input.pickup.coords, input.dropoff.coords)
  const scheduledFor = Number(input.scheduledFor) || Date.now()
  const s = {
    id: `SD-${Math.floor(1000 + Math.random() * 9000)}`,
    trackingId: generateTrackingId(),
    customerId: input.customerId,
    customerName: input.customerName,
    pickup: input.pickup,
    dropoff: input.dropoff,
    packageType: input.packageType || 'Express',
    weightKg: input.weightKg ?? 1,
    note: input.note || '',
    price: Math.round(km * 3 + (input.packageType === 'Cargo' ? 8 : input.packageType === 'Express' ? 4 : 2)),
    distanceKm: Math.round(km * 10) / 10,
    status: 'scheduled',
    scheduledFor,
    createdAt: Date.now(),
    statusTimestamps: { scheduled: Date.now() },
  }
  store.scheduled = [s, ...(store.scheduled ?? [])]
  emit()
  return s
}

export function cancelScheduled(id) {
  store.scheduled = (store.scheduled ?? []).filter((s) => s.id !== id)
  emit()
}

// Promote a scheduled order into a real delivery once its time arrives,
// or when the customer/rider triggers it manually.
export function dispatchScheduled(id) {
  const s = (store.scheduled ?? []).find((x) => x.id === id)
  if (!s) return null
  const d = createDelivery({
    customerId: s.customerId,
    customerName: s.customerName,
    pickup: s.pickup,
    dropoff: s.dropoff,
    packageType: s.packageType,
    weightKg: s.weightKg,
    note: s.note,
  })
  cancelScheduled(id)
  return d
}

export function createRide(input) {
  const km = distance(input.pickup.coords, input.dropoff.coords)
  const d = {
    id: `SW-R-${Math.floor(1000 + Math.random() * 9000)}`,
    trackingId: generateTrackingId(),
    customerId: input.customerId,
    customerName: input.customerName,
    type: 'ride',
    rideType: input.rideType,
    pickup: input.pickup,
    dropoff: input.dropoff,
    price: input.fare,
    distanceKm: Math.round(km * 10) / 10,
    status: 'pending',
    createdAt: Date.now(),
    statusTimestamps: { pending: Date.now() },
    etaMinutes: Math.max(5, Math.round(km * 4)),
    _frac: 0,
  }
  store.deliveries = [d, ...store.deliveries]
  emit()
  return d
}

// Match a pending ride to one registered rider. Matching does not accept the
// job; the rider still has to accept it from the rider dashboard.
export function assignAvailableRider(id) {
  hydrate()
  const delivery = store.deliveries.find((d) => d.id === id)
  if (!delivery || delivery.status !== 'pending' || delivery.riderId) return delivery ?? null
  const rider = store.users.find((user) => user.role === 'rider' && user.isAvailable !== false && user.id !== delivery.customerId)
  if (!rider) return null

  const matched = {
    ...delivery,
    riderId: rider.id,
    riderName: rider.name,
    riderMatchedAt: Date.now(),
  }
  store.deliveries = store.deliveries.map((item) => item.id === id ? matched : item)
  emit()
  return matched
}

export function updateDeliveryStatus(id, status, riderId, riderName) {
  store.deliveries = store.deliveries.map((d) => {
    if (d.id !== id) return d
    const next = { ...d, status, statusTimestamps: { ...(d.statusTimestamps ?? {}), [status]: Date.now() } }
    if (riderId) {
      next.riderId = riderId
      next.riderName = riderName
    }
    if (status === 'in_transit') {
      next.courierPosition = next.courierPosition ?? d.pickup.coords
      next._frac = next._frac ?? 0
      ensureAutoAdvance()
    }
    if (status === 'delivered') {
      next.courierPosition = d.dropoff.coords
      next._frac = 1
      stopAutoAdvance()
    }
    if (status === 'cancelled') {
      stopAutoAdvance()
    }
    return next
  })
  emit()
}

export function advanceCourier(id, fraction) {
  store.deliveries = store.deliveries.map((d) => {
    if (d.id !== id) return d
    const p = d.pickup.coords
    const q = d.dropoff.coords
    return {
      ...d,
      _frac: fraction,
      courierPosition: {
        lat: p.lat + (q.lat - p.lat) * fraction,
        lng: p.lng + (q.lng - p.lng) * fraction,
      },
    }
  })
  emitSilent() // skip localStorage write for smooth courier movement
}

export function resetDemo() {
  store = defaultStore()
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(SESSION_KEY)
  }
  emit()
}

export const STATUS_LABEL = {
  pending: 'Pending',
  accepted: 'Accepted',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// ── Admin actions ─────────────────────────────────────────────────────
// Full CRUD on users so the operations team can manage the platform
// exactly like a Firebase console.
export function updateUser(id, updates) {
  hydrate()
  let updated = null
  store.users = store.users.map((u) => {
    if (u.id !== id) return u
    updated = { ...u, ...updates }
    return updated
  })
  emit()
  return updated
}

export function deleteUser(id) {
  hydrate()
  store.users = store.users.filter((u) => u.id !== id)
  // Clean up their deliveries too so history stays consistent.
  store.deliveries = store.deliveries.filter((d) => d.customerId !== id && d.riderId !== id)
  emit()
}

// Create a user from the admin console. Admins can create any role,
// including other admins. A unique UID is added to every user.
export function createUser({ name, email, password, role = 'customer', phone, ...details }) {
  hydrate()
  if (!name?.trim() || !email?.trim() || !password?.trim()) return null
  if (store.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) return null
  const id = `u-${Math.random().toString(36).slice(2, 8)}`
  const uid = `UID-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  const user = {
    id,
    uid,
    name: name.trim(),
    email: email.trim(),
    password: password.trim(),
    role,
    phone: phone?.trim() || '',
    createdAt: Date.now(),
    ...(role === 'rider'
      ? {
          rating: 5,
          trips: 0,
          vehicleType: details.vehicleType,
          vehicleColor: details.vehicleColor,
          plateNumber: details.plateNumber,
          licenseNumber: details.licenseNumber,
          nin: details.nin,
          bankName: details.bankName,
          accountNumber: details.accountNumber,
        }
      : {}),
  }
  store.users = [...store.users, user]
  emit()
  return user
}

export function deleteDelivery(id) {
  hydrate()
  store.deliveries = store.deliveries.filter((d) => d.id !== id)
  emit()
}

export function adminResetDelivery(id) {
  hydrate()
  store.deliveries = store.deliveries.map((d) => d.id === id ? { ...d, status: 'pending', statusTimestamps: { pending: Date.now() }, courierPosition: undefined, _frac: 0 } : d)
  emit()
}

// ── Support tickets ───────────────────────────────────────────────────
// Resets the password for a user matching the given email. In a real app
// this would email a reset link — for the demo we just set a new password
// and let the user know it worked.
export function forgotPassword(email, newPassword = 'reset1234') {
  hydrate()
  const user = store.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase())
  if (!user) return null
  store.users = store.users.map((u) => u.id === user.id ? { ...u, password: newPassword } : u)
  emit()
  return user
}

// Set any user's password directly from the admin console. The new
// password takes effect on the very next signIn() call.
export function adminSetPassword(userId, newPassword) {
  hydrate()
  if (!newPassword || !String(newPassword).trim()) return null
  let updated = null
  store.users = store.users.map((u) => {
    if (u.id !== userId) return u
    updated = { ...u, password: String(newPassword).trim() }
    return updated
  })
  emit()
  return updated
}

export function createSupportTicket({ customerId, customerName, subject, message, priority = 'normal' }) {
  const t = {
    id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId,
    customerName,
    subject,
    priority,
    status: 'open',
    createdAt: Date.now(),
    messages: [{ sender: 'customer', content: message, at: Date.now() }],
  }
  store.supportTickets = [t, ...(store.supportTickets ?? [])]
  emit()
  return t
}

export function replyToTicket(ticketId, content, sender = 'admin') {
  store.supportTickets = (store.supportTickets ?? []).map((t) =>
    t.id === ticketId
      ? { ...t, messages: [...t.messages, { sender, content, at: Date.now() }] }
      : t,
  )
  emit()
  return store.supportTickets.find((t) => t.id === ticketId)
}

export function updateTicketStatus(ticketId, status) {
  store.supportTickets = (store.supportTickets ?? []).map((t) =>
    t.id === ticketId ? { ...t, status } : t,
  )
  emit()
}

export function setDeliveries(deliveries) {
  store.deliveries = Array.isArray(deliveries) ? deliveries : []
  emit()
}


export function setUsers(users) {
  store.users = Array.isArray(users) ? users : []
  emit()
}

export function upsertUser(user) {
  if (!user || !user.id) return
  const idx = store.users.findIndex((u) => u.id === user.id)
  if (idx >= 0) {
    store.users = store.users.map((u) => (u.id === user.id ? { ...u, ...user } : u))
  } else {
    store.users = [...store.users, user]
  }
  emit()
}

export function setSession(session) {
  store.session = session
  emit()
}
