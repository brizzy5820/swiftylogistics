// Tracks which order's chat thread is currently visible on screen (set by
// ChatThread while mounted+active) so the global notifier can skip toasting
// about a message the person is already looking at live.
let activeChatOrderId = null

export function setActiveChatOrder(orderId) {
  activeChatOrderId = orderId || null
}

export function getActiveChatOrder() {
  return activeChatOrderId
}
