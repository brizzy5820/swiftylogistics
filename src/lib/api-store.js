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

let store = { 
  users: storedUsers || [], 
  deliveries: [], 
  scheduled: [], 
  supportTickets: [], 
  session: storedSession, 
  hydrated: false, 
  loading: !storedSession && !storedUsers
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

function mapOrder(order) {
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

function upsertDelivery(mapped) {
  const exists = store.deliveries.some((d) => d.id === mapped.id)
  store.deliveries = exists
    ? store.deliveries.map((d) => (d.id === mapped.id ? mapped : d))
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

async function hydrate() {
  if (store.hydrated || !token()) return
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
        store.deliveries = (orders.orders || []).map(mapOrder)
        store.supportTickets = (tickets.tickets || []).map(mapTicket)
      } else if (me.user.role === 'rider') {
        const [profile, jobs] = await Promise.all([api.getRiderProfile(), api.getRiderJobs()])
        store.users = [mapUser(profile.rider || me.user)]
        store.deliveries = (jobs.jobs || []).map(mapOrder)
      } else {
        const [deliveries, rides, tickets] = await Promise.all([
          api.getDeliveries(), api.getRides(), api.getSupportTickets().catch(() => ({ tickets: [] })),
        ])
        store.deliveries = [...(deliveries.deliveries || []), ...(rides.rides || [])].map(mapOrder)
        store.supportTickets = (tickets.tickets || []).map(mapTicket)
      }
      store.scheduled = store.deliveries.filter((item) => item.status === 'scheduled')
      store.hydrated = true
    } catch (error) {
      if (error.status === 401) {
        api.logout()
        store.session = null
        store.users = []
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
export function getStore() { if (!store.hydrated) void hydrate(); return store }
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
  if (!store.hydrated) await hydrate()
  
  return getCurrentUser()
}

export function getCurrentUser() {
  const current = store.users.find((user) => String(user._id || user.id) === String(store.session?.userId))
  return current || (store.session ? { id: store.session.userId, role: store.session.role } : null)
}

export async function signIn(email, password) {
  const data = await api.login({ email, password })
  api.setToken(data.accessToken)
  store.session = { userId: data.user.id || data.user._id, role: data.user.role }
  store.users = [data.user]
  store.hydrated = false
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
  emit()
  await hydrate()
  if (role === 'rider' && Object.keys(details).some((key) => !['password'].includes(key))) {
    const profile = Object.fromEntries(Object.entries(details).filter(([key]) => key !== 'password' && details[key]))
    if (Object.keys(profile).length) await updateCurrentUser(profile)
  }
  return getCurrentUser()
}

export function signOut() { 
  api.logout(); 
  disconnectSocket()
  store = { users: [], deliveries: [], scheduled: [], supportTickets: [], session: null, hydrated: false, loading: false }; 
  localStorage.removeItem('swifty_session')
  localStorage.removeItem('swifty_users')
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
  const data = await api.assignRide(id)
  if (!data.ride) return null
  const order = mapOrder(data.ride)
  store.deliveries = store.deliveries.map((d) => d.id === id ? order : d)
  emit()
  return order
}
export async function updateDeliveryStatus(id, status) {
  let data
  const current = getCurrentUser()
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
  const order = mapOrder(data.delivery || data.ride || data.order); store.deliveries = store.deliveries.map((d) => d.id === id ? order : d); emit(); return order
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
