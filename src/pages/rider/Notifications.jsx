import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Bell, Briefcase, CheckCircle2, Clock3, Truck } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useStore } from '@/lib/mock-store'

const NOTIFICATION_READ_KEY = 'swifty-notifications-read-at'

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function dayGroup(value) {
  const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(new Date(Number(value)))) / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return 'Earlier'
}

function isPaymentIncomplete(user) {
  return !user.vehicleType || !user.plateNumber || !user.licenseNumber || !user.nin || !user.bankName || !user.accountNumber
}

export default function RiderNotifications() {
  const navigate = useNavigate()
  const user = useRequireAuth('rider')
  const [readAt, setReadAt] = useState(() => {
    if (typeof window === 'undefined') return 0
    return Number(window.localStorage.getItem(NOTIFICATION_READ_KEY)) || 0
  })
  const deliveries = useStore((s) =>
    user ? s.deliveries.filter((d) => d.status === 'pending' || d.riderId === user.id) : [],
  )

  const notifications = useMemo(() => {
    if (!deliveries.length) return []

    const items = []
    deliveries.forEach((delivery) => {
      if (delivery.status === 'pending') {
        items.push({
          id: `${delivery.id}-available`,
          title: 'New ride request',
          description: `${delivery.id} is available nearby for ${delivery.pickup.address} to ${delivery.dropoff.address}.`,
          time: delivery.createdAt,
          icon: Briefcase,
        })
        return
      }

      const timestamps = delivery.statusTimestamps ?? {}
      if (timestamps.accepted) {
        items.push({
          id: `${delivery.id}-accepted`,
          title: 'Ride accepted',
          description: `${delivery.id} has been added to your active jobs.`,
          time: timestamps.accepted,
          icon: Briefcase,
        })
      }
      if (timestamps.picked_up) {
        items.push({
          id: `${delivery.id}-picked-up`,
          title: 'Picked up',
          description: `${delivery.id} pickup has been confirmed.`,
          time: timestamps.picked_up,
          icon: Truck,
        })
      }
      if (timestamps.in_transit) {
        items.push({
          id: `${delivery.id}-in-transit`,
          title: 'Trip started',
          description: `${delivery.id} is now moving toward dropoff.`,
          time: timestamps.in_transit,
          icon: Truck,
        })
      }
      if (timestamps.delivered) {
        items.push({
          id: `${delivery.id}-delivered`,
          title: 'Delivery completed',
          description: `${delivery.id} was completed successfully. Your payout has been recorded.`,
          time: timestamps.delivered,
          icon: CheckCircle2,
        })
      }
    })

    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 12)
  }, [deliveries])

  if (!user) return null

  const paymentIncomplete = isPaymentIncomplete(user)

  function markAllRead() {
    const nextReadAt = Date.now()
    window.localStorage.setItem(NOTIFICATION_READ_KEY, String(nextReadAt))
    setReadAt(nextReadAt)
    window.dispatchEvent(new Event('swifty:notifications-read'))
  }

  function handleBack() {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate('/rider')
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Notifications</p>
            <h1 className="text-2xl font-bold text-slate-900">Rider activity</h1>
          </div>
          {(notifications.length > 0 || paymentIncomplete) && (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-emerald-50"
            >
              Read all
            </button>
          )}
        </div>

        {paymentIncomplete && (
          <Link
            to="/rider/account"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm transition hover:bg-amber-100/70"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600">
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold">Complete payment & verification details</p>
               
              </div>
              <p className="mt-1 text-sm text-amber-700">
                Add your vehicle, license, NIN, and bank details to finish setup and receive payouts.
              </p>
            </div>
          </Link>
        )}

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No job activity yet</h2>
            <p className="mt-2 text-sm text-slate-500">Ride requests and job status updates will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item, index) => {
              const Icon = item.icon
              const group = dayGroup(item.time)
              const showHeader = index === 0 || group !== dayGroup(notifications[index - 1].time)
              return (
                <div key={item.id}>
                  {showHeader && (
                    <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-400 first:mt-0">
                      {group}
                    </p>
                  )}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${Number(item.time) > readAt ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        {Number(item.time) > readAt && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />}
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            <Clock3 className="h-3 w-3" />
                            {formatTime(item.time)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </AppShell>
  )
}
