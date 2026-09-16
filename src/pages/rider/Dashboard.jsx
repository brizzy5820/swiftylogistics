import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Star, Trophy, AlertCircle, ChevronRight, GripHorizontal, X, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { TripCard } from '@/components/trip-card'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useStore, updateDeliveryStatus } from '@/lib/mock-store'
import { RiderMap } from '@/components/rider-map'
import { updateRiderDeliveryStatus } from '@/services/api'
import { getDeliveries } from '@/services/api'

const MAP_COLLAPSED = 36
const MAP_DEFAULT = 260
const MAP_MAX = 560
// Desktop sidebar
const SIDEBAR_MAX = 320
const SIDEBAR_DEFAULT = 400
const SIDEBAR_MIN = 820

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ---------- Hoisted presentational pieces (never define these inside the component body) ----------

function OnlineBadge({ light, jobCount }) {
  return (
    <div
      className={
        'flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm ' +
        (light ? 'border-white/20 bg-black/35 backdrop-blur-md' : 'border-slate-200 bg-slate-50')
      }
    >
      <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className={'text-xs font-bold uppercase tracking-wider ' + (light ? 'text-white' : 'text-slate-600')}>
        Online
      </span>
      {typeof jobCount === 'number' && (
        <>
          <span className={'h-3 w-px ' + (light ? 'bg-white/30' : 'bg-slate-300')} />
          <span className={'text-xs font-bold ' + (light ? 'text-white' : 'text-slate-600')}>
            {jobCount} nearby
          </span>
        </>
      )}
    </div>
  )
}

function PaymentBanner({ onDismiss }) {
  return (
    <div className="relative rounded-2xl hidden border border-amber-200 bg-amber-50 pr-10 text-amber-800">
      <Link to="/rider/account" className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-amber-100/60 rounded-2xl">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Complete your payment &amp; verification details</p>
            <p className="text-xs text-amber-700">Add your vehicle, license, and bank details to start receiving payouts.</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onDismiss()
        }}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-amber-600 transition hover:bg-amber-200/70"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function EarningsCard({ amount, count }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-emerald-800 text-white p-6 shadow-lg">
      <p className="text-xs font-bold uppercase tracking-wider text-white/60">Today&apos;s earnings</p>
      <p className="mt-1 font-display text-4xl font-bold">₦{amount}</p>
      <p className="mt-2 text-xs text-emerald-400 font-medium">+ {count} deliveries completed</p>
    </div>
  )
}

function GreetingEarningsCard({ name, amount, count }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-emerald-800 text-white p-6 shadow-lg">
      <p className="font-display text-lg font-bold">
        {getGreeting()}, {name}
      </p>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/60">Today&apos;s earnings</p>
      <p className="mt-1 font-display text-4xl font-bold">₦{amount}</p>
      <p className="mt-2 text-xs text-emerald-400 font-medium">+ {count} deliveries completed</p>
    </div>
  )
}

function StatRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4 text-slate-300" />
        <p className="text-xs">{label}</p>
      </div>
      <p className="font-display font-bold">{value}</p>
    </div>
  )
}

function StatsCard({ activeJobs, rating, trips }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm space-y-4">
      <StatRow icon={Briefcase} label="Active jobs" value={activeJobs} />
      <StatRow icon={Star} label="Rating" value={rating} />
      <StatRow icon={Trophy} label="Total trips" value={trips} />
    </div>
  )
}

function SectionCard({ title, subtitle, right, children }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function IncomingList({ incoming, onAccept, onReject }) {
  if (incoming.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">No incoming requests right now.</p>
  }
  return (
    <div className="space-y-4">
      {incoming.map((d) => (
        <TripCard
          key={d.id}
          delivery={d}
          actionLabel="Accept ride"
          onAction={() => onAccept(d.id)}
          onSecondary={() => onReject(d.id)}
          disableNavigation
        />
      ))}
    </div>
  )
}

function ActiveJobsList({ myJobs }) {
  return (
    <div className="space-y-3">
      {myJobs.map((d) => (
        <TripCard key={d.id} delivery={d} actionLabel="Open" actionTo={'/rider/job/' + d.id} />
      ))}
    </div>
  )
}

// ---------- Main component ----------

export default function RiderDashboard() {
  const user = useRequireAuth('rider')
  const [mapHeight, setMapHeight] = useState(MAP_COLLAPSED)
  const [showMap, setShowMap] = useState(false)
  const [paymentDismissed, setPaymentDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Desktop resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef({ x: 0, width: SIDEBAR_DEFAULT })

  const incoming = useStore((s) => s.deliveries.filter((d) => d.status === 'pending' && (!d.riderId || d.riderId === user?.id)))
  const myJobs = useStore((s) =>
    user ? s.deliveries.filter((d) => d.riderId === user.id && d.status !== 'delivered' && d.status !== 'cancelled') : [],
  )
  const completed = useStore((s) =>
    user ? s.deliveries.filter((d) => d.riderId === user.id && d.status === 'delivered') : [],
  )
  const todayEarnings = completed.reduce((a, d) => a + d.price, 0)

  const firstName = user?.name?.split(' ')[0] || ''
  const paymentIncomplete =
    !user?.vehicleType || !user?.plateNumber || !user?.licenseNumber || !user?.nin || !user?.bankName || !user?.accountNumber
  const showPaymentBanner = paymentIncomplete && !paymentDismissed
  const mapJobs = [...incoming, ...myJobs]

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    setLoading(true)
    getDeliveries().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [user?.id])

  function accept(id) {
    updateRiderDeliveryStatus(id, 'accepted').catch(() => {
      updateDeliveryStatus(id, 'accepted', user.id, user.name)
    })
  }

  function reject(id) {
    updateRiderDeliveryStatus(id, 'cancelled').catch(() => {
      updateDeliveryStatus(id, 'cancelled')
    })
  }

  // Mobile: toggle map visibility
  function toggleMap() {
    const next = !showMap
    setShowMap(next)
    setMapHeight(next ? MAP_DEFAULT : MAP_COLLAPSED)
  }

  // Desktop: resize handlers
  const handleResizeStart = useCallback((e) => {
    resizeStartRef.current = { x: e.clientX, width: sidebarWidth }
    setIsResizing(true)
    document.documentElement.style.cursor = 'col-resize'
    document.documentElement.style.userSelect = 'none'
  }, [sidebarWidth])

  const handleResizeMove = useCallback((e) => {
    if (!isResizing) return
    const delta = e.clientX - resizeStartRef.current.x
    const newWidth = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, resizeStartRef.current.width + delta))
    setSidebarWidth(newWidth)
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    document.documentElement.style.cursor = ''
    document.documentElement.style.userSelect = ''
  }, [])

  if (!user) return null

  return (
    <AppShell>
      {loading && (
        <div className="mx-4 mt-6 flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 sm:mx-6 lg:mx-8">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading your jobs...
        </div>
      )}
      {/* Incomplete payment details modal — surfaces on first dashboard visit
          after sign-up/login when the rider hasn't filled in vehicle/verification. */}
      {paymentIncomplete && !paymentDismissed && (
        <div  onClick={() => setPaymentDismissed(true)} className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="relative h-32 w-full bg-emerald-900  ">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-amber-200">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentDismissed(true)}
                aria-label="Dismiss reminder"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-500 backdrop-blur transition hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <h2 className="font-display text-xl font-black text-slate-950">Finish setting up your rider profile</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Before you can start accepting jobs, we need your vehicle, license, and payout details.
                It only takes a minute.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Vehicle type', ok: !!user.vehicleType },
                  { label: 'Plate number', ok: !!user.plateNumber },
                  { label: "Driver's license", ok: !!user.licenseNumber },
                  { label: 'NIN', ok: !!user.nin },
                  { label: 'Bank name', ok: !!user.bankName },
                  { label: 'Account number', ok: !!user.accountNumber },
                ].map((row) => (
                  <div key={row.label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${row.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${row.ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {row.label}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to="/rider/account"
                  onClick={() => setPaymentDismissed(true)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  Complete now
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setPaymentDismissed(true)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Remind me later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE ================= */}
      <div className="md:hidden">
        <div 
          className="relative overflow-hidden bg-slate-100 transition-all duration-300" 
          style={{ height: mapHeight }}
        >
          {showMap && (
            <>
              <RiderMap jobs={mapJobs} onAccept={accept} />
              <div className="pointer-events-none absolute inset-x-0 top-0 z-[410] bg-gradient-to-b from-slate-950/45 via-slate-950/20 to-transparent px-4 pb-8 pt-3">
              
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/20 to-transparent" />
              <div className="absolute right-3 top-3">
                <OnlineBadge light jobCount={mapJobs.length} />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={toggleMap}
            aria-label={showMap ? 'Hide map' : 'Show map'}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 active:bg-slate-100 shadow-sm"
          >
            <GripHorizontal className="h-4 w-4" />
            {showMap ? 'Hide map' : 'Show map'}
          </button>
        </div>

        <div className="space-y-4 p-4">
          {showPaymentBanner && <PaymentBanner onDismiss={() => setPaymentDismissed(true)} />}

          <GreetingEarningsCard name={firstName} amount={todayEarnings} count={completed.length} />
          <StatsCard activeJobs={myJobs.length} rating={user.rating ?? 5} trips={user.trips ?? 0} />

          {myJobs.length > 0 && (
            <SectionCard title="Your active jobs" subtitle={`${myJobs.length} in progress`}>
              <ActiveJobsList myJobs={myJobs} />
            </SectionCard>
          )}

          <SectionCard title="Job requests" subtitle={`${incoming.length} available nearby`}>
            <IncomingList incoming={incoming} onAccept={accept} onReject={reject} />
          </SectionCard>
        </div>
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden md:flex md:h-[calc(100vh-72px)] md:gap-6 md:p-6 relative">
        {/* Resizable Sidebar */}
        <aside 
          className="flex shrink-0 flex-col gap-5 overflow-y-auto pr-1 border-r border-slate-200"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* ... sidebar content unchanged ... */}
          <div>
           
            {/* <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening around you.</p> */}
          </div>

          {showPaymentBanner && <PaymentBanner onDismiss={() => setPaymentDismissed(true)} />}

          <EarningsCard amount={todayEarnings} count={completed.length} />
          <StatsCard activeJobs={myJobs.length} rating={user.rating ?? 5} trips={user.trips ?? 0} />

          {myJobs.length > 0 && (
            <SectionCard title="Your active jobs" subtitle={`${myJobs.length} in progress`}>
              <ActiveJobsList myJobs={myJobs} />
            </SectionCard>
          )}

          <SectionCard title="Job requests" subtitle={`${incoming.length} available nearby`}>
            <IncomingList incoming={incoming} onAccept={accept} onReject={reject} />
          </SectionCard>
        </aside>

        {/* Resize Handle */}
        <div
          className={`absolute top-0 bottom-0 w-[3px] bg-transparent hover:bg-emerald-500/40 active:bg-emerald-500 cursor-col-resize z-50 transition-colors ${isResizing ? 'bg-emerald-500' : ''}`}
          style={{ left: `${sidebarWidth + 24}px` }}
          onMouseDown={handleResizeStart}
          onMouseMove={handleResizeMove}
          onMouseUp={handleResizeEnd}
          onMouseLeave={handleResizeEnd}
        />

        {/* Map Area */}
        <section className="relative min-w-0 flex-1 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <RiderMap jobs={mapJobs} onAccept={accept} />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-950/25 to-transparent" />
          <div className="absolute right-4 top-4">
            <OnlineBadge light jobCount={mapJobs.length} />
          </div>
        </section>
      </div>
    </AppShell>
  )
}