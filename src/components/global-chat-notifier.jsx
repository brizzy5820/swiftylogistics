import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'
import { getSocket } from '@/lib/socket'
import { useCurrentUser, getStore } from '@/lib/api-store'
import { getActiveChatOrder } from '@/lib/chat-notify'

/**
 * Mounted once, app-wide (see App.jsx). Listens for incoming chat messages
 * on the shared socket and surfaces a brief top banner via sonner — which
 * is already positioned top-center and swipeable by default, so this is
 * mostly about deciding *when* to show one and what it says. Works for
 * both a rider and a customer, since both sides share the same socket
 * event and the destination route is picked from the signed-in user's role.
 */
export function GlobalChatNotifier() {
  const { user } = useCurrentUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return undefined
    const socket = getSocket()
    if (!socket) return undefined

    function handleMessage(message) {
      if (String(message.sender) === String(user.id)) return // my own message echoed back
      if (message.orderId === getActiveChatOrder()) return // already open on screen

      const order = getStore().deliveries.find((d) => d.id === message.orderId)
      const senderName = message.senderRole === 'rider' ? order?.riderName || 'Your rider' : order?.customerName || 'Your customer'
      const destination = user.role === 'rider' ? `/rider/job/${message.orderId}` : `/customer/track/${message.orderId}`

      toast(senderName, {
        description: message.text,
        duration: 3000,
        icon: <MessageCircle className="h-4 w-4" />,
        action: { label: 'View', onClick: () => navigate(destination) },
      })
    }

    socket.on('chat:message', handleMessage)
    return () => socket.off('chat:message', handleMessage)
  }, [user?.id, user?.role, navigate])

  return null
}
