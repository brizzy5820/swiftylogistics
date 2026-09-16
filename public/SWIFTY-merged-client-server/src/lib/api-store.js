import { useEffect, useRef, useState } from 'react'
import * as api from '../services/api'

export const VEHICLE_TYPES = ['Bike', 'Car', 'Van']
export const STATUS_LABEL = {
  scheduled: 'Scheduled', pending: 'Searching', accepted: 'Accepted', picked_up: 'Picked up',
  in_transit: 'In transit', delivered: 'Delivered', cancelled: 'Cancelled',
}

let store = { users: [], deliveries: [], scheduled: [], supportTickets: [], session: null, hydrated: false, loading: false }
const listeners = new Set()
let loadPromise = null

const emit = () => listeners.forEach((listener) => listener())
const token = () => sessionStorage.getItem('swifty_access_token')

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

async function hydrate() {
  if (store.hydrated || !token()) return
  if (loadPromise) return loadPromise
  store.loading = true
  loadPromise = (async () => {
    try {
      const me = await api.getMe()
      store.session = { userId: me.user.id || me.user._id, role: me.user.role }
      store.users = [mapUser(me.user)]
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
  sessionStorage.setItem('swifty_access_token', data.accessToken)
  store.session = { userId: data.user.id || data.user._id, role: data.user.role }
  store.users = [data.user]
  store.hydrated = false
  emit()
  await hydrate()
  return data.user
}

export async function signUp(name, email, role, details = {}) {
  const data = await api.register({ name, email, password: details.password, phone: details.phone, role })
  sessionStorage.setItem('swifty_access_token', data.accessToken)
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

export function signOut() { api.logout(); store = { users: [], deliveries: [], scheduled: [], supportTickets: [], session: null, hydrated: false, loading: false }; emit() }

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
  const data = await api.createRide({ pickup: input.pickup, dropoff: input.dropoff, rideType: input.rideType })
  const order = mapOrder(data.ride); store.deliveries = [order, ...store.deliveries]; emit(); return order
}
export async function assignAvailableRider(id) {
  const data = await api.assignRide(id)
  if (!data.ride) return null
  const order = mapOrder(data.ride)
  store.deliveries = store.deliveries.map((d) => d.id === id ? order : d)
  emit()
  return { ...order.rider, id: order.rider?._id || order.rider?.id, riderId: order.riderId }
}
export async function updateDeliveryStatus(id, status) {
  let data
  const current = getCurrentUser()
  if (current?.role === 'rider') data = status === 'accepted' ? await api.acceptRiderJob(id) : await api.updateRiderDeliveryStatus(id, status)
  else if (current?.role === 'admin') data = await api.updateAdminOrderStatus(id, status)
  else if (status === 'cancelled') data = await (store.deliveries.find((d) => d.id === id)?.type === 'ride' ? api.cancelRide(id) : api.cancelDelivery(id))
  else throw new Error('Only an assigned rider or administrator can update this status')
  const order = mapOrder(data.delivery || data.ride || data.order); store.deliveries = store.deliveries.map((d) => d.id === id ? order : d); emit(); return order
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
