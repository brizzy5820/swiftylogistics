const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export { API_BASE_URL }

const TOKEN_KEY = 'swifty_access_token'

const getToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(TOKEN_KEY, token)
}

export const clearToken = () => {
  cache.clear()
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

// Messages keyed by the server's stable error `code` so every error says exactly what happened.
const CODE_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SESSION_EXPIRED: 'Session expired. Please sign in again.',
  INVALID_SESSION: 'Your session is no longer valid. Please sign in again.',
  AUTH_REQUIRED: 'Please sign in to continue.',
  ACCOUNT_NOT_FOUND: null, // server message is already specific
  RATE_LIMITED: null,
  TIMEOUT: 'The server is taking too long to respond. Please try again.',
  NETWORK: 'No internet connection. Check your network and try again.',
}

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback
  const code = error.code || error.data?.code
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code]
  if (error.data?.errors?.length) return error.data.errors[0].message
  if (error.status === 0) return CODE_MESSAGES.NETWORK
  if (error.data?.message) return error.data.message
  if (error.status === 401) return CODE_MESSAGES.SESSION_EXPIRED
  if (error.status === 403) return 'You do not have permission to do this.'
  if (error.status === 404) return 'We could not find what you were looking for.'
  if (error.status >= 500) return 'Our server had a problem. Please try again shortly.'
  return error.message || fallback
}

// ── Request layer ────────────────────────────────────────────────
// • GETs are de-duplicated (concurrent identical calls share one request)
// • GET responses are cached in memory for a short TTL (stale-while-revalidate
//   style data is handled by React Query on top of this)
// • any mutation clears the cache so reads after writes are always fresh
// • every request has a timeout so the UI never hangs forever
const GET_TTL = 5_000
const inflight = new Map()
const cache = new Map()
export const clearRequestCache = () => { cache.clear(); inflight.clear() }

const SESSION_CODES = new Set(['SESSION_EXPIRED', 'INVALID_SESSION', 'ACCOUNT_NOT_FOUND', 'AUTH_REQUIRED'])

async function rawRequest(endpoint, options) {
  const token = getToken()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeout ?? 15_000)
  let response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch (cause) {
    const timedOut = cause?.name === 'AbortError'
    const error = new Error(timedOut ? CODE_MESSAGES.TIMEOUT : CODE_MESSAGES.NETWORK)
    error.status = 0
    error.code = timedOut ? 'TIMEOUT' : 'NETWORK'
    error.cause = cause
    throw error
  } finally {
    clearTimeout(timer)
  }

  const text = await response.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = { message: text } }

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong')
    error.status = response.status
    error.code = data.code
    error.data = data
    // A dead session anywhere in the app signs the user out cleanly.
    if (response.status === 401 && token && SESSION_CODES.has(data.code) && !endpoint.startsWith('/auth/login')) {
      clearToken()
      window.dispatchEvent(new CustomEvent('swifty:session-expired', { detail: { message: getErrorMessage(error) } }))
    }
    throw error
  }
  return data
}

const request = (endpoint, options = {}) => {
  const method = (options.method || 'GET').toUpperCase()
  if (method !== 'GET') {
    cache.clear()
    return rawRequest(endpoint, options)
  }
  const key = `${getToken() || ''}|${endpoint}`
  const hit = cache.get(key)
  if (hit && hit.exp > Date.now() && !options.fresh) return Promise.resolve(hit.data)
  if (inflight.has(key)) return inflight.get(key)
  const p = rawRequest(endpoint, options)
    .then((data) => { cache.set(key, { data, exp: Date.now() + GET_TTL }); return data })
    .finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

export { request }

export const register = (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
export const login = (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
export const socialAuth = (payload) => request('/auth/social', { method: 'POST', body: JSON.stringify(payload) })
export const getMe = () => request('/auth/me')
export const changePassword = (password) => request('/auth/password', { method: 'PATCH', body: JSON.stringify({ password }) })
export const updateMe = (payload) => request('/users/me', { method: 'PATCH', body: JSON.stringify(payload) })
export const logout = clearToken

export const getAddresses = () => request('/addresses')
export const createAddress = (payload) => request('/addresses', { method: 'POST', body: JSON.stringify(payload) })
export const updateAddress = (id, payload) => request(`/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteAddress = (id) => request(`/addresses/${id}`, { method: 'DELETE' })

export const createDelivery = (payload) => request('/deliveries', { method: 'POST', body: JSON.stringify(payload) })
export const getDeliveries = () => request('/deliveries')
export const getDelivery = (id) => request(`/deliveries/${id}`)
export const cancelDelivery = (id) => request(`/deliveries/${id}/cancel`, { method: 'PATCH' })
export const getTracking = (id) => request(`/tracking/${id}`)
export const getPublicTracking = (trackingId) => request(`/tracking/public/${encodeURIComponent(trackingId)}`)
export const confirmTracking = (id) => request(`/tracking/${id}/confirm`, { method: 'PATCH' })
export const getMessages = (id) => request(`/tracking/${id}/messages`)

export const createRide = (payload) => request('/rides', { method: 'POST', body: JSON.stringify(payload) })
export const getRides = () => request('/rides')
export const getRide = (id) => request(`/rides/${id}`)
export const cancelRide = (id) => request(`/rides/${id}/cancel`, { method: 'PATCH' })
export const assignRide = (id) => request(`/rides/${id}/assign`, { method: 'PATCH' })

export const getNotifications = () => request('/notifications')
export const getUnreadCount = () => request('/notifications/unread-count')
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, { method: 'PATCH' })
export const markAllNotificationsRead = () => request('/notifications/read-all', { method: 'PATCH' })

export const getRiderProfile = () => request('/riders/me')
export const updateRiderProfile = (payload) => request('/riders/me', { method: 'PATCH', body: JSON.stringify(payload) })
export const getRiderJobs = () => request('/riders/jobs')
export const getRiderJob = (id) => request(`/riders/jobs/${id}`)
export const acceptRiderJob = (id) => request(`/riders/jobs/${id}/accept`, { method: 'PATCH' })
export const updateRiderDeliveryStatus = (id, status) => request(`/riders/deliveries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })

export const getAdminDashboard = () => request('/admin/dashboard')
export const getAdminUsers = (query = '') => request(`/admin/users${query ? `?${query}` : ''}`)
export const getAdminUser = (id) => request(`/admin/users/${id}`)
export const updateAdminUser = (id, payload) => request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const setAdminUserPassword = (id, password) => request(`/admin/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) })
export const updateAdminUserStatus = (id, isActive) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
export const getAdminRiders = (query = '') => request(`/admin/riders${query ? `?${query}` : ''}`)
export const getAdminOrders = (query = '') => request(`/admin/orders${query ? `?${query}` : ''}`)
export const getAdminOrder = (id) => request(`/admin/orders/${id}`)
export const assignAdminRider = (id, riderId) => request(`/admin/orders/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ riderId }) })
export const autoAssignAdminRider = (id) => request(`/admin/orders/${id}/auto-assign`, { method: 'PATCH' })
export const updateAdminOrderStatus = (id, status) => request(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const resetAdminOrder = (id) => request(`/admin/orders/${id}/reset`, { method: 'PATCH' })
export const deleteAdminOrder = (id) => request(`/admin/orders/${id}`, { method: 'DELETE' })
export const cancelAdminOrder = (id) => request(`/admin/orders/${id}/cancel`, { method: 'PATCH' })
export const createAdminUser = (payload) => request('/admin/users', { method: 'POST', body: JSON.stringify(payload) })
export const deleteAdminUser = (id) => request(`/admin/users/${id}`, { method: 'DELETE' })

export const getSupportTickets = (admin = false) => request(admin ? '/support/admin/all' : '/support')
export const createSupportTicket = (payload) => request('/support', { method: 'POST', body: JSON.stringify(payload) })
export const replySupportTicket = (id, content) => request(`/support/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ content }) })
export const updateSupportTicket = (id, status) => request(`/support/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
