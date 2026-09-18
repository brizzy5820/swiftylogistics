import { io } from 'socket.io-client'
import { API_BASE_URL } from '@/services/api'

// The REST base is typically ".../api" — the socket server listens on the
// same host but at the root, not under /api.
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '') || window.location.origin

let socket = null

/**
 * Connect (or reuse) the single realtime socket for the signed-in user.
 * Safe to call repeatedly — it's a no-op if a live connection already
 * exists for the same token.
 */
export function connectSocket(token) {
  if (!token) return null
  if (socket && socket.connected && socket.auth?.token === token) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  })

  return socket
}

export function getSocket() {
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
    if (!socket || !socket.connected) {
      resolve({ ok: false, error: 'Not connected — check your connection and try again.' })
      return
    }
    socket.emit('chat:send', { orderId, text }, (response) => {
      resolve(response || { ok: false, error: 'No response from server' })
    })
  })
}
