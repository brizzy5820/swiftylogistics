import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Route as RouteIcon,
  Scale,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { BottomSheet } from '@/components/bottom-sheet'
import { TripCard } from '@/components/trip-card'
import { useRequireAuth } from '@/lib/use-require-auth'
import { STATUS_LABEL, useStore } from '@/lib/mock-store'

const STATUS_STYLES = {
  pending: { badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', rail: 'bg-orange-500' },
  delivered: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', rail: 'bg-emerald-500' },
}
const DEFAULT_STATUS_STYLE = { badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-600', rail: 'bg-emerald-600' }

function statusStyle(status) {
  return STATUS_STYLES[status] || DEFAULT_STATUS_STYLE
}

function formatDateTime(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function History() {
  const user = useRequireAuth('customer')
  const navigate = useNavigate()
  const deliveries = useStore((s) => (user ? s.deliveries.filter((d) => d.customerId === user.id) : []))
  const [activeDelivery, setActiveDelivery] = useState(null)
  const [open, setOpen] = useState(false)

  if (!user) return null

  const pending = deliveries.filter((d) => d.status === 'pending')
  const active = deliveries.filter((d) => d.status !== 'delivered' && d.status !== 'cancelled')
  const completed = deliveries.filter((d) => d.status === 'delivered')
  const sortedDeliveries = [...deliveries].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))

  function handleBack() {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate('/customer')
    }
  }

  function openInvoice(delivery) {
    setActiveDelivery(delivery)
    setOpen(true)
  }

  return (
    <AppShell hideMobileHeader>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        
        <div className="text-center flex items-center gap-1 sm:flex-row sm:items-center">
      
 <h1 className="font-display text-left text-3xl font-bold tracking-tight text-slate-900">Activites</h1>
          
        </div>
<p className="text-sm  text-left text-slate-500">click delivery log to view details</p>
        {/* <div className="mt-6 flex flex-wrap gap-3 sm:gap-4">
          <StatCard icon={Package} label="Pending" value={pending.length} tone="text-orange-600 bg-orange-500/10" />
          <StatCard icon={Clock} label="In progress" value={active.length} tone="text-emerald-600 bg-emerald-50" />
          <StatCard icon={CheckCircle} label="Completed" value={completed.length} tone="text-emerald-600 bg-emerald-500/10" />
        </div> */}

        <section className="mt-6 space-y-3">
          {deliveries.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Package className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm text-slate-500">
                No deliveries yet.{' '}
                <Link to="/customer/book" className="font-semibold text-emerald-600 hover:underline">
                  Book one now
                </Link>
              </p>
            </div>
          ) : (
            sortedDeliveries.map((delivery) => (
              // TripCard owns its own click here — pass onClick directly instead of
              // wrapping it in a <button>. Nesting a <button> around TripCard's own
              // clickable root fired BOTH handlers on every click (inner navigate,
              // then outer openInvoice), which is why the modal opened and then
              // immediately routed away. Passing onClick makes TripCard skip its
              // internal navigate() and hand the click fully to this parent instead.
              <TripCard key={delivery.id} delivery={delivery} onClick={openInvoice} />
            ))
          )}
        </section>

        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title={activeDelivery?.id ?? 'Shipment details'}
          description="Full record for this shipment, including the activity log and timestamps."
          footer={
            activeDelivery && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate('/customer/track/' + activeDelivery.id)
                }}
                className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
              >
                Track delivery
              </button>
            )
          }
        >
          {activeDelivery ? (
            <ShipmentDetails delivery={activeDelivery} />
          ) : (
            <div className="py-10 text-center text-slate-500">Select a shipment to see its details.</div>
          )}
        </BottomSheet>
      </main>
    </AppShell>
  )
}

function ShipmentDetails({ delivery: d }) {
  const style = statusStyle(d.status)
  const timestamps = d.statusTimestamps ?? {}
  const booked = formatDateTime(timestamps.pending ?? d.createdAt)
  const accepted = formatDateTime(timestamps.accepted)
  const pickedUp = formatDateTime(timestamps.picked_up)
  const inTransit = formatDateTime(timestamps.in_transit)
  const delivered = formatDateTime(timestamps.delivered)

  const timeline = [
    { label: 'Booked', time: booked, done: Boolean(booked), detail: 'Order submitted and queued for a rider.' },
    { label: 'Accepted', time: accepted, done: Boolean(accepted), detail: 'Your rider confirmed the pickup request.' },
    { label: 'Picked up', time: pickedUp, done: Boolean(pickedUp), detail: 'The package was collected from the pickup point.' },
    { label: 'In transit', time: inTransit, done: Boolean(inTransit), detail: 'The shipment is moving toward the destination.' },
    { label: 'Delivered', time: delivered, done: Boolean(delivered), detail: 'The order was completed successfully.' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${style.badge}`}>
            {STATUS_LABEL[d.status]}
          </span>
          {d.trackingId && <span className="text-xs text-slate-500">Tracking ID: {d.trackingId}</span>}
        </div>
        <p className="text-lg font-semibold text-slate-900">NGN {d.price}</p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Activity log</p>
        <ol className="mt-4 space-y-4">
          {timeline.map((step, i) => (
            <li key={step.label} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <span className={`h-2.5 w-2.5 rounded-full ${step.done ? style.rail : 'bg-slate-200'}`} />
                {i < timeline.length - 1 && <span className="mt-1 h-8 w-px bg-slate-200" />}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                <p className="mt-1 text-xs text-slate-500">{step.detail}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">{step.time ?? 'Not yet recorded'}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            <MapPin className="h-3.5 w-3.5" /> Pickup
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{d.pickup?.address}</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            <MapPin className="h-3.5 w-3.5" /> Drop-off
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{d.dropoff?.address}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Detail icon={Package} label="Package" value={d.packageType} />
          {d.weightKg != null && <Detail icon={Scale} label="Weight" value={`${d.weightKg} kg`} />}
          <Detail icon={RouteIcon} label="Distance" value={`${d.distanceKm} km`} />
          <Detail icon={Clock} label="ETA" value={d.etaMinutes != null ? `${d.etaMinutes} min` : 'Not set'} />
        </div>
      </div>
    </div>
  )
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        <Icon className="h-3.5 w-3.5 text-slate-400" /> {value}
      </p>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="min-w-[112px] flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
    </div>
  )
}
