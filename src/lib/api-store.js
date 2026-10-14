import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import * as api from '../services/api'
import { connectSocket, disconnectSocket } from './socket'

export const VEHICLE_TYPES = ['Bike', 'Car', 'Van']
export const STATUS_LABEL = {
  scheduled: 'Scheduled', pending: 'Searching', accepted: 'Accepted', picked_up: 'Picked up',
  in_transit: 'In transit', delivered: 'Delivered', cancelled: 'Cancelled',
}

function getStoredSession() {
  try {
    const sessionStr = localStorage.getItem('swifty_session')
    if (sessionStr) return JSON.parse(sessionStr)
    const sessionStr2 = sessionStorage.getItem('swifty_session')
    if (sessionStr2) return JSON.parse(sessionStr2)
  } catch {}
  return null
}

function getStoredUsers() {
  try {
    const usersStr = localStorage.getItem('swifty_users')
    if (usersStr) return JSON.parse(usersStr)
  } catch {}
  return null
}

const storedSession = getStoredSession()
const storedUsers = getStoredUsers()

function getStoredTheme() {
  try {
    const theme = localStorage.getItem('swifty_theme')
    if (theme === 'dark' || theme === 'light') return theme
    // Default to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  } catch {}
  return 'light'
}

// ── Guest checkout session ─────────────────────────────────────────────
// A guest is a device-scoped anonymous customer. They tap "Proceed as guest"
// and browse the customer pages with no account at all. The session itself is
// deliberately contact-free: an email/phone is collected inside the booking
// flow, once per ride, and is stored on that one order (and sent to riders so
// they can reach the customer) — never remembered on the device. That is what
// separates a guest from a signed-in customer.
//
// Each guest order is a real server order (`status: pending`, `rider: null`),
// so real drivers accept it from their job list; the client adopts it locally
// as this device's own. That local copy is what survives a reload, and it is
// the only thing handed to an account if the guest later signs in on THIS
// device. Signing in with the same email on any other device has nothing to
// hand over, which is why that device starts fresh.
function generateGuestDeviceId() {
  return 'dev-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36)
}

export function getGuestSession() {
  try {
    const raw = localStorage.getItem('swifty_guest_session')
    if (!raw) return null
    const session = JSON.parse(raw)
    if (!session || typeof session !== 'object') return null
    // Backfill a device id for sessions written before we added one, so a
    // returning guest keeps the same device instead of looking like a new one.
    if (!session.deviceId) {
      session.deviceId = generateGuestDeviceId()
      localStorage.setItem('swifty_guest_session', JSON.stringify(session))
    }
    return session
  } catch {}
  return null
}

export function setGuestSession(email, phone) {
  const previous = getGuestSession()
  const session = {
    email: email?.trim()?.toLowerCase() || null,
    phone: phone?.trim() || null,
    deviceId: previous?.deviceId || generateGuestDeviceId(),
    createdAt: previous?.createdAt || Date.now(),
  }
  localStorage.setItem('swifty_guest_session', JSON.stringify(session))
  return session
}

export function clearGuestSession() {
  try { localStorage.removeItem('swifty_guest_session') } catch {}
}

// Builds the stable "customer" value used for every guest-authored order on
// this device. Pairing the device id with the email means two guests sharing
// one device never see each other's rides.
function guestCustomerId(session = getGuestSession()) {
  if (!session) return null
  return 'guest-' + (session.deviceId || 'anon') + '-' + (session.email || 'anon')
}

function isGuestOwnedOrder(order, session = getGuestSession()) {
  if (!order || !session) return false
  // `guestCreated` is stamped at booking time and never removed, so an order
  // stays "this device's guest order" even after it has been relabelled with a
  // real customerId at sign-in. Without it hydrate() — which rebuilds
  // store.deliveries from the API, where the order only ever existed as an
  // anonymous one — would silently drop the guest's own history.
  if (order.guestCreated === true) return true
  if (String(order.customerId || order.customer || '').startsWith('guest-')) return true
  const email = session.email?.toLowerCase()
  if (email && String(order.guestEmail || '').toLowerCase() === email) return true
  if (session.phone && String(order.guestPhone || '') === session.phone) return true
  return false
}

export function getGuestActivities() {
  const session = getGuestSession()
  if (!session) return []
  return store.deliveries.filter((d) => isGuestOwnedOrder(d, session))
}

// The synthetic user a guest browses as, with the same id the store stamps on
// their orders. Exported so route guards, app shell and history filters all
// agree on what "this guest" means.
export function getGuestUser() {
  const session = getGuestSession()
  if (!session) return null
  return {
    id: guestCustomerId(session),
    role: 'customer',
    name: 'Guest',
    email: session.email || '',
    phone: session.phone || '',
    isGuest: true,
  }
}

const GUEST_DELIVERIES_KEY = 'swifty_guest_deliveries'

function readStoredGuestDeliveries() {
  try {
    const raw = localStorage.getItem(GUEST_DELIVERIES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {}
  return []
}

// Guest orders survive reloads only because of this. Signed-in orders come
// from the API on hydrate, so we keep the guest list apart and let merge layer
// it back in underneath. `guestCreated` (not the session) is the marker, so the
// list stays intact even after the guest session has been cleared by a sign-in
// on this same device — that is exactly the "continue on this device" case.
function persistGuestDeliveries() {
  try {
    const guests = store.deliveries.filter((d) => d?.guestCreated === true)
    if (guests.length) {
      localStorage.setItem(GUEST_DELIVERIES_KEY, JSON.stringify(guests))
    } else {
      localStorage.removeItem(GUEST_DELIVERIES_KEY)
    }
  } catch {}
}

function mergeGuestDeliveries() {
  const stored = readStoredGuestDeliveries()
  if (!stored.length) return
  store.deliveries = [
    ...stored,
    ...store.deliveries.filter((d) => !stored.some((s) => String(s.id) === String(d.id))),
  ]
  store.scheduled = store.deliveries.filter((item) => item.status === 'scheduled')
}

// Called after a successful sign-in / sign-up. Only the device that actually
// holds the guest's localStorage data can hand it over, so this is the one and
// only place guest history ever becomes account history. The device is the
// boundary: signing in with the same email anywhere else has nothing to hand
// over, which is why that device starts fresh.
function linkGuestActivitiesToUser(userId) {
  const session = getGuestSession()
  if (!session || !userId) return
  const linked = store.deliveries.filter((d) => isGuestOwnedOrder(d, session))
  if (!linked.length) return
  store.deliveries = store.deliveries.map((d) =>
    linked.includes(d) ? { ...d, customerId: userId, customer: userId } : d
  )
  clearGuestSession()
}

let store = {
  users: storedUsers || [],
  // Guest orders are restored straight from localStorage so a guest (no token,
  // so hydrate() does nothing beyond settling) still sees their history on the
  // very first paint.
  deliveries: readStoredGuestDeliveries(),
  scheduled: readStoredGuestDeliveries().filter((item) => item.status === 'scheduled'),
  supportTickets: [],
  session: storedSession,
  hydrated: false,
  // Only a token means there is something to hydrate. Starting a guest at
  // `loading: true` left every guest-only screen stuck on its skeleton, because
  // nothing was ever going to fetch anything.
  loading: Boolean(token()) && !storedSession && !storedUsers,
  hydrateFailed: false,
  theme: getStoredTheme()
}
const listeners = new Set()
let loadPromise = null

const emit = () => {
  // Persist session and users to localStorage
  if (store.session) {
    localStorage.setItem('swifty_session', JSON.stringify(store.session))
  }
  if (store.users.length) {
    localStorage.setItem('swifty_users', JSON.stringify(store.users))
  }
  // Persist theme
  if (store.theme) {
    localStorage.setItem('swifty_theme', store.theme)
  }
  // Guest orders are the only ones that must outlive a reload, since they
  // never reach the account-scoped API history.
  persistGuestDeliveries()
  listeners.forEach((listener) => listener())
}
const token = () => localStorage.getItem('swifty_access_token') || sessionStorage.getItem('swifty_access_token')

function mapUser(user) {
  if (!user) return user
  return { ...user, id: user._id || user.id }
}

function mapTicket(ticket) {
  if (!ticket) return ticket
  const customer = ticket.customer && typeof ticket.customer === 'object' ? ticket.customer : null
  return { ...ticket, id: ticket._id || ticket.id, customerName: customer?.name || ticket.customerName, messages: ticket.replies || ticket.messages || [], createdAt: ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now() }
}

export function mapOrder(order) {
  if (!order) return order
  const customer = order.customer && typeof order.customer === 'object' ? order.customer : null
  const rider = order.rider && typeof order.rider === 'object' ? order.rider : null
  return {
    ...order,
    id: order._id || order.id,
    customerId: customer?._id || order.customerId || order.customer,
    customerName: customer?.name || order.customerName,
    riderId: rider?._id || order.riderId || order.rider,
    riderName: rider?.name || order.riderName || null,
    createdAt: order.createdAt ? new Date(order.createdAt).getTime() : Date.now(),
    scheduledFor: order.scheduledFor ? new Date(order.scheduledFor).getTime() : null,
    statusTimestamps: order.statusTimestamps || {},
  }
}

export function upsertDelivery(mapped) {
  if (!mapped || !mapped.id) return
  const exists = store.deliveries.some((d) => String(d.id) === String(mapped.id))
  store.deliveries = exists
    ? store.deliveries.map((d) => (String(d.id) === String(mapped.id) ? mapped : d))
    : [mapped, ...store.deliveries]
  store.scheduled = store.deliveries.filter((item) => item.status === 'scheduled')
}

// Attach realtime listeners to the current socket exactly once per
// connection. Every event patches the store directly so status changes
// (driver picked up / delivered / etc.) show up without a refresh.
function wireSocket() {
  const socket = connectSocket(token())
  if (!socket || socket._swiftyWired) return
  socket._swiftyWired = true

  socket.on('order:update', (order) => {
    upsertDelivery(mapOrder(order))
    emit()
  })

  socket.on('job:new', (order) => {
    const current = getCurrentUser()
    if (current?.role !== 'rider') return
    upsertDelivery(mapOrder(order))
    emit()
  })

  socket.on('job:assigned', (order) => {
    upsertDelivery(mapOrder(order))
    emit()
    toast.success('New job assigned to you')
  })
}

// Replaces store.deliveries with a freshly fetched server list while keeping
// any order already in the store that the server did not return. The one case
// that matters: a guest signs in on this device, linkGuestActivitiesToUser()
// relabels their local guest orders with the new userId, and hydrate() then
// refetches — but those orders were created with `customer: null`, so the
// account-scoped endpoints never return them. Without this they vanish the
// moment the guest becomes a customer.
function replaceDeliveries(serverOrders) {
  const mapped = (serverOrders || []).map(mapOrder)
  const seen = new Set(mapped.map((d) => String(d.id)))
  store.deliveries = [...mapped, ...store.deliveries.filter((d) => !seen.has(String(d.id)))]
}

async function hydrate() {
  if (store.hydrated || store.hydrateFailed) return
  // No token on this device — a guest, or a signed-out visitor. There is
  // nothing to fetch, so settle right now instead of leaving the store in its
  // initial `loading: true` forever: everything a guest owns is already in
  // localStorage (see readStoredGuestDeliveries), and a permanently "loading"
  // store is what kept their activity off the dashboard.
  if (!token()) {
    store.loading = false
    store.hydrated = true
    emit()
    return
  }
  if (loadPromise) return loadPromise
  store.loading = true
  emit()
  loadPromise = (async () => {
    try {
      const me = await api.getMe()
      store.session = { userId: me.user.id || me.user._id, role: me.user.role }
      store.users = [mapUser(me.user)]
      wireSocket()
      if (me.user.role === 'admin') {
        const [users, orders, tickets] = await Promise.all([
          api.getAdminUsers(), api.getAdminOrders(), api.getSupportTickets(true).catch(() => ({ tickets: [] })),
        ])
        store.users = (users.users || []).map(mapUser)
        replaceDeliveries(orders.orders || [])
        store.supportTickets = (tickets.tickets || []).map(mapTicket)
      } else if (me.user.role === 'rider') {
        const [profile, jobs] = await Promise.all([api.getRiderProfile(), api.getRiderJobs()])
        store.users = [mapUser(profile.rider || me.user)]
        replaceDeliveries(jobs.jobs || [])
      } else {
        const [deliveries, rides, tickets] = await Promise.all([
          api.getDeliveries(), api.getRides(), api.getSupportTickets().catch(() => ({ tickets: [] })),
        ])
        // Guest orders re-attached after linking must survive the refetch, so
        // keep them and drop any server-side duplicate of the same order.
        replaceDeliveries([...(deliveries.deliveries || []), ...(rides.rides || [])])
        store.supportTickets = (tickets.tickets || []).map(mapTicket)
      }
      store.scheduled = store.deliveries.filter((item) => item.status === 'scheduled')
      store.hydrated = true
    } catch (error) {
      if (error.status === 401) {
        api.logout()
        store.session = null
        store.users = []
        store.hydrated = true
        store.hydrateFailed = true
        localStorage.removeItem('swifty_session')
        localStorage.removeItem('swifty_users')
      }
    } finally {
      store.loading = false
      loadPromise = null
      emit()
    }
  })()
  return loadPromise
}

export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function getStore() { if (!store.hydrated && !store.hydrateFailed) void hydrate(); return store }
export { emit }
export function useStore(selector) {
  const selectorRef = useRef(selector)
  const [value, setValue] = useState(() => selector(store))
  useEffect(() => { selectorRef.current = selector }, [selector])
  useEffect(() => {
    void hydrate()
    const update = () => setValue(selectorRef.current(store))
    update()
    return subscribe(update)
  }, [])
  return value
}

export function useCurrentUser() {
  const session = useStore((s) => s.session)
  const users = useStore((s) => s.users)
  const loading = useStore((s) => s.loading)
  
  if (loading && !session) {
    return { user: null, loading: true }
  }
  
  if (!session) {
    return { user: null, loading: false }
  }
  
  const currentUser = users.find((user) => String(user._id || user.id) === String(session.userId))
  return { user: currentUser || { id: session.userId, role: session.role }, loading: false }
}

export async function ensureSession() {
  if (!token()) return null
  if (!store.hydrated && !store.hydrateFailed) await hydrate()
  
  return getCurrentUser()
}

export function getCurrentUser() {
  const current = store.users.find((user) => String(user._id || user.id) === String(store.session?.userId))
  return current || (store.session ? { id: store.session.userId, role: store.session.role } : null)
}

function clearSessionFlags() {
  try { sessionStorage.removeItem('swifty_payment_reminder_seen') } catch {}
}

export async function signIn(email, password) {
  const data = await api.login({ email, password })
  api.setToken(data.accessToken)
  store.session = { userId: data.user.id || data.user._id, role: data.user.role }
  store.users = [data.user]
  store.hydrated = false
  store.hydrateFailed = false
  clearSessionFlags()
  linkGuestActivitiesToUser(store.session.userId)
  emit()
  await hydrate()
  return data.user
}

export async function signInWithSocial(provider, idToken, role, intent = 'login') {
  const data = await api.socialAuth({ provider, idToken, role, intent })
  api.setToken(data.accessToken)
  store.session = { userId: data.user.id || data.user._id, role: data.user.role }
  store.users = [data.user]
  store.hydrated = false
  store.hydrateFailed = false
  clearSessionFlags()
  linkGuestActivitiesToUser(store.session.userId)
  emit()
  await hydrate()
  return data.user
}

export async function signUp(name, email, role, details = {}) {
  const data = await api.register({ name, email, password: details.password, phone: details.phone, role })
  api.setToken(data.accessToken)
  store.session = { userId: data.user.id || data.user._id, role: data.user.role }
  store.users = [data.user]
  store.hydrated = false
  store.hydrateFailed = false
  clearSessionFlags()
  linkGuestActivitiesToUser(store.session.userId)
  emit()
  await hydrate()
  if (role === 'rider' && Object.keys(details).some((key) => !['password'].includes(key))) {
    const profile = Object.fromEntries(Object.entries(details).filter(([key]) => key !== 'password' && details[key]))
    if (Object.keys(profile).length) await updateCurrentUser(profile)
  }
  return getCurrentUser()
}

export function setTheme(newTheme) {
  if (newTheme !== 'light' && newTheme !== 'dark') return
  store.theme = newTheme
  localStorage.setItem('swifty_theme', newTheme)
  emit()
}

export function signOut() { 
  api.logout(); 
  disconnectSocket()
  clearSessionFlags()
  store = { users: [], deliveries: [], scheduled: [], supportTickets: [], session: null, hydrated: false, loading: false, hydrateFailed: false, theme: store.theme }; 
  localStorage.removeItem('swifty_session')
  emit()
}

export const changePassword = async (password) => api.changePassword(password)

export async function updateCurrentUser(updates) {
  const current = getCurrentUser()
  const riderFields = ['vehicleType', 'vehicleColor', 'plateNumber', 'licenseNumber', 'nin', 'bankName', 'accountNumber', 'isAvailable']
  const hasRiderFields = current?.role === 'rider' && Object.keys(updates).some((key) => riderFields.includes(key))
  const data = hasRiderFields ? await api.updateRiderProfile(updates) : await api.updateMe(updates)
  const updated = mapUser(data.user || data.rider)
  store.users = store.users.map((user) => String(user._id || user.id) === String(store.session?.userId) ? updated : user)
  emit()
  return updated
}

async function refreshOrders() {
  const current = getCurrentUser()
  if (!current) return
  if (current.role === 'admin') {
    const [orders, users, tickets] = await Promise.all([api.getAdminOrders(), api.getAdminUsers(), api.getSupportTickets(true).catch(() => ({ tickets: [] }))])
    store.deliveries = (orders.orders || []).map(mapOrder); store.users = (users.users || []).map(mapUser); store.supportTickets = (tickets.tickets || []).map(mapTicket)
  } else if (current.role === 'rider') {
    const jobs = await api.getRiderJobs(); store.deliveries = (jobs.jobs || []).map(mapOrder)
  } else {
    const [deliveries, rides, tickets] = await Promise.all([api.getDeliveries(), api.getRides(), api.getSupportTickets().catch(() => ({ tickets: [] }))])
    store.deliveries = [...(deliveries.deliveries || []), ...(rides.rides || [])].map(mapOrder); store.supportTickets = (tickets.tickets || []).map(mapTicket)
  }
  store.scheduled = store.deliveries.filter((item) => item.status === 'scheduled')
  // Re-attach any guest orders this device owns (including ones handed over to
  // a signed-in account), so a refresh never drops them.
  mergeGuestDeliveries()
  emit()
}

function addressPayload(item) {
  const coords = item.coords || { lat: 6.5244, lng: 3.3792 }
  const label = String(item.address || 'Saved place').slice(0, 50)
  return { label, addressLine: String(item.address || '').slice(0, 250), city: 'Lagos', state: 'Lagos', country: 'Nigeria', coordinates: { latitude: Number(coords.lat), longitude: Number(coords.lng) } }
}

async function ensureAddress(item) {
  const data = await api.createAddress(addressPayload(item))
  return data.address._id || data.address.id
}

export async function createDelivery(input) {
  const currentUser = getCurrentUser()

  // Guest checkout: same shape as a guest ride — one real server order with the
  // guest's contact attached, adopted locally as this device's own so a real
  // driver can accept it from the job queue and the guest can still follow it.
  if (!currentUser) {
    const session = getGuestSession()
    const customerId = guestCustomerId(session)

    const data = await api.createDelivery({
      pickup: input.pickup,
      dropoff: input.dropoff,
      packageType: input.packageType,
      weightKg: input.weightKg,
      note: input.note,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
    })
    if (!data.delivery) throw new Error('Unable to create your delivery. Please try again.')

    const order = mapOrder(data.delivery)
    const guestOrder = {
      ...order,
      customerId,
      customer: customerId,
      guestEmail: input.guestEmail || order.guestEmail || null,
      guestPhone: input.guestPhone || order.guestPhone || null,
      guestCreated: true,
    }
    store.deliveries = [guestOrder, ...store.deliveries]
    store.scheduled = store.deliveries.filter((item) => item.status === 'scheduled')
    emit()
    return guestOrder
  }

  const [pickupAddress, dropoffAddress] = await Promise.all([ensureAddress(input.pickup), ensureAddress(input.dropoff)])
  const data = await api.createDelivery({ pickupAddress, dropoffAddress, packageType: input.packageType, weightKg: input.weightKg, note: input.note })
  const order = mapOrder(data.delivery)
  store.deliveries = [order, ...store.deliveries]; emit(); return order
}

export async function scheduleDelivery(input) {
  const [pickupAddress, dropoffAddress] = await Promise.all([ensureAddress(input.pickup), ensureAddress(input.dropoff)])
  const data = await api.createDelivery({ pickupAddress, dropoffAddress, packageType: input.packageType === 'Standard' ? 'Express' : input.packageType, weightKg: input.weightKg, note: input.note, scheduledFor: new Date(input.scheduledFor).toISOString() })
  const order = mapOrder(data.delivery)
  store.deliveries = [order, ...store.deliveries]; store.scheduled = [order, ...store.scheduled]; emit(); return order
}

export async function cancelScheduled(id) { const data = await api.cancelDelivery(id); const order = mapOrder(data.delivery); store.deliveries = store.deliveries.map((d) => d.id === id ? order : d); store.scheduled = store.scheduled.filter((d) => d.id !== id); emit(); return order }
export async function createRide(input) {
  const currentUser = getCurrentUser()

  // Guest checkout: one order, real from the start. It is created on the server
  // with the guest's contact so it lands in the riders' job queue as a normal
  // `status: pending, rider: null` job, and a real driver accepts it from their
  // dashboard. The client then adopts that server order as this device's own,
  // so its id and tracking code are the ones riders actually work against.
  // There is deliberately no offline fallback: an order no real rider can see
  // is worse than an error the customer can act on.
  if (!currentUser) {
    const session = getGuestSession()
    const customerId = guestCustomerId(session)

    const data = await api.createRide({
      pickup: input.pickup,
      dropoff: input.dropoff,
      rideType: input.rideType,
      paymentMethod: input.paymentMethod,
      customPrice: input.customPrice,
      email: input.guestEmail,
      phone: input.guestPhone,
    })
    if (!data.ride) throw new Error('Unable to create your ride. Please try again.')

    const order = mapOrder(data.ride)
    const guestOrder = {
      ...order,
      customerId,
      customer: customerId,
      guestEmail: input.guestEmail || order.guestEmail || null,
      guestPhone: input.guestPhone || order.guestPhone || null,
      guestCreated: true,
    }
    store.deliveries = [guestOrder, ...store.deliveries]
    emit()
    return guestOrder
  }

  const data = await api.createRide({
    pickup: input.pickup,
    dropoff: input.dropoff,
    rideType: input.rideType,
    paymentMethod: input.paymentMethod,
    customPrice: input.customPrice,
  })
  const order = mapOrder(data.ride); store.deliveries = [order, ...store.deliveries]; emit(); return order
}
export async function assignAvailableRider(id) {
  const currentUser = getCurrentUser()

  // Guest checkout. A guest is never handed a stand-in driver: their order is
  // already a real job in the riders' queue (`status: pending`, `rider: null`),
  // and a real driver accepts it from their dashboard. All this can do is watch
  // for that acceptance, and the public tracking payload is the only thing an
  // anonymous customer is allowed to read — so that is what we poll.
  if (!currentUser) {
    const delivery = store.deliveries.find((d) => d.id === id)
    if (!delivery) throw new Error('Ride not found')
    if (delivery.rider || delivery.riderId) return delivery

    const data = await api.getPublicTracking(delivery.trackingId)
    const tracked = data?.tracking
    if (!tracked) return null

    const mapped = mapOrder(tracked)
    if (!(mapped.rider || mapped.riderId || mapped.riderName)) return null

    // Local order first, so ride-specific fields (rideType, payment method,
    // guest contact) survive; the server's live fields then win on top.
    const merged = {
      ...delivery,
      ...mapped,
      customerId: delivery.customerId,
      customer: delivery.customerId,
      guestCreated: true,
    }
    upsertDelivery(merged)
    emit()
    return merged
  }
  
  const data = await api.assignRide(id)
  if (!data.ride) return null
  const order = mapOrder(data.ride)
  store.deliveries = store.deliveries.map((d) => d.id === id ? order : d)
  emit()
  return order
}
export async function updateDeliveryStatus(id, status) {
  const current = getCurrentUser()

  // Guest checkout: an anonymous order lives only on this device, so its
  // status changes are local. Cancelling is the one a guest can perform; the
  // rest are driven by the rider on the server-side copy.
  if (!current) {
    const delivery = store.deliveries.find((d) => d.id === id)
    if (!delivery) throw new Error('Delivery not found')

    if (status === 'cancelled') {
      delivery.status = 'cancelled'
      delivery.statusTimestamps = { ...delivery.statusTimestamps, cancelled: Date.now() }
    }

    emit()
    return delivery
  }
  
  let data
  const delivery = store.deliveries.find((d) => d.id === id)
  const isRide = delivery?.type === 'ride'
  const cancelApi = isRide ? api.cancelRide : api.cancelDelivery
  
  if (current?.role === 'rider') {
    if (status === 'accepted') {
      data = await api.acceptRiderJob(id)
    } else if (status === 'cancelled') {
      // Allow riders to cancel their assigned rides
      data = await cancelApi(id)
    } else {
      data = await api.updateRiderDeliveryStatus(id, status)
    }
  } else if (current?.role === 'admin') {
    data = await api.updateAdminOrderStatus(id, status)
  } else if (status === 'cancelled') {
    // Customer cancelling
    data = await cancelApi(id)
  } else {
    throw new Error('Only an assigned rider or administrator can update this status')
  }
  const order = mapOrder(data?.delivery || data?.ride || data?.order || data?.job)
  if (order) {
    upsertDelivery(order)
    emit()
  }
  return order
}
// Customer confirms the assigned rider/ride from the track page. This is
// the gate a rider's "Start trip" button waits on — see updateDeliveryStatus
// in server/src/services/rider.services.js.
export async function confirmOrder(id) {
  const data = await api.confirmTracking(id)
  const order = mapOrder(data.delivery)
  upsertDelivery(order)
  emit()
  return order
}
export async function deleteDelivery(id) { await api.deleteAdminOrder(id); store.deliveries = store.deliveries.filter((d) => d.id !== id); emit(); return true }
export async function adminResetDelivery(id) { const data = await api.resetAdminOrder(id); const order = mapOrder(data.order); store.deliveries = store.deliveries.map((d) => d.id === id ? order : d); emit(); return order }

export async function updateUser(id, updates) { const data = await api.updateAdminUser(id, updates); const user = mapUser(data.user); store.users = store.users.map((u) => String(u._id || u.id) === String(id) ? user : u); emit(); return user }
export async function deleteUser(id) { await api.deleteAdminUser(id); store.users = store.users.filter((u) => String(u._id || u.id) !== String(id)); emit(); return true }
export async function createUser(payload) { const data = await api.createAdminUser(payload); store.users = [data.user, ...store.users]; emit(); return data.user }
export async function adminSetPassword(id, password) { await api.setAdminUserPassword(id, password); return true }

export async function replyToTicket(id, content) { const data = await api.replySupportTicket(id, content); await refreshOrders(); return data.ticket }
export async function updateTicketStatus(id, status) { const data = await api.updateSupportTicket(id, status); await refreshOrders(); return data.ticket }
export async function createSupportTicket(payload) { const data = await api.createSupportTicket(payload); await refreshOrders(); return data.ticket }


// Any request that finds the session dead signs the user out once, app-wide.
if (typeof window !== 'undefined') {
  window.addEventListener('swifty:session-expired', (e) => {
    if (!store.session) return
    signOut()
    toast.error(e.detail?.message || 'Session expired. Please sign in again.', { id: 'session-expired' })
  })
}
