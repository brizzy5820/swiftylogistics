const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export { API_BASE_URL }

const getToken = () => sessionStorage.getItem('swifty_access_token')

const request = async (endpoint, options = {}) => {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const text = await response.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = { message: text } }

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export { request }

export const register = (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
export const login = (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
export const getMe = () => request('/auth/me')
export const changePassword = (password) => request('/auth/password', { method: 'PATCH', body: JSON.stringify({ password }) })
export const updateMe = (payload) => request('/users/me', { method: 'PATCH', body: JSON.stringify(payload) })
export const logout = () => { sessionStorage.removeItem('swifty_access_token') }

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
