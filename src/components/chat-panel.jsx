import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { getSocket, sendChatMessage } from '@/lib/socket'
import { getMessages, getErrorMessage } from '@/services/api'
import { setActiveChatOrder } from '@/lib/chat-notify'

/**
 * All the chat state/logic for one order's thread, with no rendering of
 * its own. Exported so a page can lay the message list and composer out
 * however its surface needs — e.g. the mobile drawer puts the list in its
 * scrollable body and the composer in its pinned footer (see Track.jsx /
 * Job.jsx), while the desktop ChatPanel below stacks them in one card.
 */
export function useChatThread(orderId, currentUserId, active = true) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  // Marks this order's chat as "on screen" so the global new-message
  // notification (lib/chat-notify.js) skips it — no point toasting about a
  // message the person is already looking at.
  useEffect(() => {
    if (!active || !orderId) return undefined
    setActiveChatOrder(orderId)
    return () => setActiveChatOrder(null)
  }, [active, orderId])

  useEffect(() => {
    if (!orderId) return
    let isCurrent = true
    setLoaded(false)
    getMessages(orderId)
      .then((data) => { if (isCurrent) { setMessages(data.messages || []); setLoaded(true) } })
      .catch(() => { if (isCurrent) setLoaded(true) })
    return () => { isCurrent = false }
  }, [orderId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !orderId) return
    const handler = (message) => {
      if (message.orderId !== orderId) return
      setMessages((current) => (current.some((m) => m._id === message._id) ? current : [...current, message]))
    }
    socket.on('chat:message', handler)
    return () => socket.off('chat:message', handler)
  }, [orderId])

  async function handleSend(event) {
    event.preventDefault()
    const value = text.trim()
    if (!value || sending) return
    setSending(true)
    setError('')
    const response = await sendChatMessage(orderId, value)
    setSending(false)
    if (!response.ok) {
      setError(getErrorMessage({ message: response.error }, 'Unable to send that message.'))
      return
    }
    setText('')
    setMessages((current) => (current.some((m) => m._id === response.message._id) ? current : [...current, response.message]))
  }

  return { messages, loaded, text, setText, sending, error, handleSend }
}

/** Scrollable message bubbles. Self-contained — give it a bounded-height
 * parent (a flex column, or MobileDrawer's own scrollable body) and it
 * fills it and auto-scrolls to the newest message. */
export function ChatMessageList({ messages, loaded, currentUserId, className = '' }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  return (
    <div ref={listRef} className={`space-y-2 ${className}`}>
      {!loaded ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-2/3 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <p className="mt-8 text-center text-xs text-slate-400">No messages yet — say hello.</p>
      ) : (
        messages.map((message) => {
          const mine = String(message.sender) === String(currentUserId)
          return (
            <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900 shadow-sm'}`}>
                {message.text}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

/** The message input + send button (or a disabled notice in its place). */
export function ChatComposer({ text, setText, sending, onSend, disabled, disabledReason, error, className = '' }) {
  if (disabled) {
    return <p className={`text-center text-xs text-slate-400 ${className}`}>{disabledReason || 'Chat opens once a rider is assigned.'}</p>
  }
  return (
    <div className={className}>
      <form onSubmit={onSend} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:bg-white"
        />
        <button type="submit" disabled={sending || !text.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="pt-2 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  )
}

/**
 * Desktop floating chat card — list + composer stacked in one panel. On
 * mobile, pages use ChatMessageList/ChatComposer directly inside their
 * MobileDrawer instead of this, so the drawer itself becomes the message
 * box rather than a second panel stacking on top of it — see Track.jsx /
 * Job.jsx.
 */
export function ChatPanel({ orderId, currentUserId, otherPartyLabel, open, onOpenChange, disabled, disabledReason }) {
  const thread = useChatThread(orderId, currentUserId, open)

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] hidden justify-center px-3 pb-3 lg:flex lg:inset-auto lg:bottom-6 lg:right-6">
      <div className="flex h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl lg:h-[28rem]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-emerald-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <p className="text-sm font-bold">{otherPartyLabel || 'Chat'}</p>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close chat" className="rounded-full p-1 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ChatMessageList messages={thread.messages} loaded={thread.loaded} currentUserId={currentUserId} className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3" />
        <ChatComposer
          text={thread.text}
          setText={thread.setText}
          sending={thread.sending}
          onSend={thread.handleSend}
          disabled={disabled}
          disabledReason={disabledReason}
          error={thread.error}
          className="shrink-0 border-t border-slate-100 p-3"
        />
      </div>
    </div>
  )
}

/** Small floating launcher — a chat bubble with an unread dot. */
export function ChatLauncher({ onClick, hasUnread }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open chat"
      className="relative flex items-center justify-center size-10 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      {hasUnread && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
    </button>
  )
}
