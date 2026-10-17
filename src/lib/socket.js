import { io } from 'socket.io-client'
import { API_BASE_URL } from '@/services/api'

// The REST base is typically ".../api" — the socket server listens on the
// same host but at the root, not under /api.
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '') || window.location.origin

let socket = null

/**
 * Connect (or reuse) the single realtime socket for the signed-in user or guest.
 * Safe to call repeatedly — it's a no-op if a live connection already exists.
 */
export function connectSocket(token, guestId) {
  const currentToken = token || (typeof localStorage !== 'undefined' ? (localStorage.getItem('swifty_access_token') || sessionStorage.getItem('swifty_access_token')) : null)
  let currentGuestId = guestId
  if (!currentToken && !currentGuestId && typeof localStorage !== 'undefined') {
    try {
      const session = JSON.parse(localStorage.getItem('swifty_guest_session') || '{}')
      currentGuestId = session.deviceId ? `guest-${session.deviceId}-${session.email || 'anon'}` : null
    } catch {}
  }

  const auth = currentToken ? { token: currentToken } : { guestId: currentGuestId || 'guest' }

  if (socket && socket.connected) {
    return socket
  }

  if (socket) {
    socket.disconnect()
    socket = null
  }

  socket = io(SOCKET_URL, {
    auth,
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  })

  return socket
}

export function getSocket() {
  if (!socket) {
    connectSocket()
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

/** Send a chat message for a given order. Resolves with { ok, message|error }. */
export function sendChatMessage(orderId, text) {
  return new Promise((resolve) => {
    const s = getSocket()
    if (!s || !s.connected) {
      resolve({ ok: false, error: 'Not connected — check your connection and try again.' })
      return
    }
    s.emit('chat:send', { orderId, text }, (response) => {
      resolve(response || { ok: false, error: 'No response from server' })
    })
  })
}
