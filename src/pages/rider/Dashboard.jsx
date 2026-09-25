import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Star, Trophy, AlertCircle, ChevronRight, GripHorizontal, X, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { TripCard } from '@/components/trip-card'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useStore, updateDeliveryStatus } from '@/lib/api-store'
import { RiderMap } from '@/components/rider-map'
import { MobileRouteMap } from '@/components/mobile-route-map'
import { getErrorMessage } from '@/services/api'

const MAP_DEFAULT = 260
const MAP_MAX = 560
// Desktop sidebar
const SIDEBAR_MAX = 320
const SIDEBAR_DEFAULT = 400
const SIDEBAR_MIN = 820

// The "finish your profile" reminder should surface once per session — the
// moment a rider lands on the dashboard right after signing in/up — and
// never again until they sign out and back in. sessionStorage (not React
// state) is what makes that survive navigating away from /rider and back.
const REMINDER_SEEN_KEY = 'swifty_payment_reminder_seen'

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

function CompletedList({ completed }) {
  if (completed.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Completed trips will show up here.</p>
  }
  return (
    <div className="space-y-3">
      {completed.slice(0, 5).map((d) => (
        <TripCard key={d.id} delivery={d} actionLabel="View" actionTo={'/rider/job/' + d.id} />
      ))}
    </div>
  )
}

// ---------- Main component ----------

export default function RiderDashboard() {
  const user = useRequireAuth('rider')
  const navigate = useNavigate()
  // Mobile map reveal: starts fully hidden (0). Dragging the handle below
  // the map area grows this height live; releasing snaps to the nearest of
  // [hidden, default, max]. No more explicit "Show map" button.
  const [mapHeight, setMapHeight] = useState(0)
  const [mapDragging, setMapDragging] = useState(false)
  const mapDragRef = useRef({ startY: 0, startHeight: 0 })
  const [paymentDismissed, setPaymentDismissed] = useState(() => {
    try { return sessionStorage.getItem(REMINDER_SEEN_KEY) === '1' } catch { return false }
  })
  const [dismissedRequests, setDismissedRequests] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  
  // Desktop resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef({ x: 0, width: SIDEBAR_DEFAULT })

  // Selecting from the raw `deliveries` array (no external closures) keeps
  // this store-subscribed and always current. Deriving incoming/myJobs/
  // completed from it in the render body — rather than closing over `user`
  // inside the useStore selector itself — is what fixes earnings/jobs going
  // stale until some unrelated store update (e.g. accepting a job) forced a
  // resync: a useStore selector's cached value only recomputes on the next
  // store emit, so a selector closed over `user` (which resolves slightly
  // later, from useRequireAuth's own async effect) kept using a stale
  // "user is null" result until something else happened to emit again.
  const deliveries = useStore((s) => s.deliveries)
  const availableRequests = user ? deliveries.filter((d) => d.status === 'pending' && (!d.riderId || d.riderId === user.id)) : []
  const incoming = availableRequests.filter((d) => !dismissedRequests.has(d.id))
  const myJobs = user ? deliveries.filter((d) => d.riderId === user.id && d.status !== 'delivered' && d.status !== 'cancelled') : []
  const completed = user ? deliveries.filter((d) => d.riderId === user.id && d.status === 'delivered') : []
  const todayEarnings = completed.reduce((a, d) => a + d.price, 0)

  const firstName = user?.name?.split(' ')[0] || ''
  const paymentIncomplete =
    !user?.vehicleType || !user?.plateNumber || !user?.licenseNumber || !user?.nin || !user?.bankName || !user?.accountNumber
  const showPaymentBanner = paymentIncomplete && !paymentDismissed
  const mapJobs = [...incoming, ...myJobs]
  const routeJob = myJobs[0] || incoming[0]

  useEffect(() => {
    if (!user) return undefined
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), 250)
    return () => window.clearTimeout(timer)
  }, [user?.id])

  // Mark the reminder as seen the instant it's actually shown — not just on
  // dismiss — so navigating away (without tapping anything) and back to
  // /rider never brings it up again this session.
  useEffect(() => {
    if (paymentIncomplete && !paymentDismissed) {
      try { sessionStorage.setItem(REMINDER_SEEN_KEY, '1') } catch {}
    }
  }, [paymentIncomplete, paymentDismissed])

  async function accept(id) {
    try {
      await updateDeliveryStatus(id, 'accepted')
      setDismissedRequests((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
      toast.success('Job accepted')
      navigate(`/rider/job/${id}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to accept this job.'))
    }
  }

  function reject(id) {
    setDismissedRequests((current) => {
      const next = new Set(current)
      next.add(id)
      return next
    })
    toast.message('Request hidden from your list')
  }

  // Mobile: drag the handle strip down to reveal the map, up to hide it.
  const MAP_SNAPS = [0, MAP_DEFAULT, MAP_MAX]
  const clampMapHeight = (value) => Math.min(MAP_MAX, Math.max(0, value))

  const handleMapDragStart = useCallback((event) => {
    mapDragRef.current = { startY: event.clientY, startHeight: mapHeight }
    setMapDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }, [mapHeight])

  const handleMapDragMove = useCallback((event) => {
    if (!mapDragging) return
    const delta = event.clientY - mapDragRef.current.startY
    setMapHeight(clampMapHeight(mapDragRef.current.startHeight + delta))
  }, [mapDragging])

  const handleMapDragEnd = useCallback(() => {
    if (!mapDragging) return
    setMapDragging(false)
    setMapHeight((current) => MAP_SNAPS.reduce((closest, point) =>
      Math.abs(point - current) < Math.abs(closest - current) ? point : closest, MAP_SNAPS[0]))
  }, [mapDragging])

  // Same gesture, extended to the page body itself — not just the handle
  // strip — so dragging down anywhere on the content also reveals the map.
  // Gated on two things so it never fights normal scrolling or taps:
  //  1. Only armed when the page is already scrolled to the very top
  //     (there's nothing above to scroll to at that point anyway).
  //  2. Only "captured" as a map-drag once the pointer has moved past a
  //     small threshold — a plain tap or an upward scroll never triggers it.
  const bodyDragRef = useRef(null)

  const handleBodyDragStart = useCallback((event) => {
    if (window.scrollY > 4) return
    bodyDragRef.current = { startY: event.clientY, startHeight: mapHeight, armed: false }
  }, [mapHeight])

  const handleBodyDragMove = useCallback((event) => {
    const state = bodyDragRef.current
    if (!state) return
    const delta = event.clientY - state.startY
    if (!state.armed) {
      if (delta > 8) {
        state.armed = true
        setMapDragging(true)
      } else {
        return
      }
    }
    setMapHeight(clampMapHeight(state.startHeight + delta))
  }, [])

  const handleBodyDragEnd = useCallback(() => {
    const state = bodyDragRef.current
    bodyDragRef.current = null
    if (!state?.armed) return
    setMapDragging(false)
    setMapHeight((current) => MAP_SNAPS.reduce((closest, point) =>
      Math.abs(point - current) < Math.abs(closest - current) ? point : closest, MAP_SNAPS[0]))
  }, [])

  const showMap = mapHeight > 20

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
            <div className="relative h-25 w-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl ">
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
        <MobileRouteMap
          jobs={mapJobs}
          onAccept={accept}
        />
        <div
          className="relative overflow-hidden bg-slate-100"
          style={{ height: mapHeight, transition: mapDragging ? 'none' : 'height 0.28s cubic-bezier(0.32, 0.72, 0, 1)' }}
        >
          {showMap && (
            <>
              <RiderMap jobs={mapJobs} onAccept={accept} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/20 to-transparent" />
              <div className="absolute right-3 top-3">
                <OnlineBadge light jobCount={mapJobs.length} />
              </div>
            </>
          )}
        </div>

        {/* Drag this handle down to reveal the map, up to hide it — no map
            is rendered at all until it's been dragged open at least once. */}
        <div
          onPointerDown={handleMapDragStart}
          onPointerMove={handleMapDragMove}
          onPointerUp={handleMapDragEnd}
          onPointerCancel={handleMapDragEnd}
          className="flex touch-none cursor-grab select-none items-center justify-center gap-2 border-b border-slate-200 bg-white py-2 text-2xs font-bold uppercase tracking-wider text-slate-400 active:cursor-grabbing"
        >
          <GripHorizontal className="h-3.5 w-3.5" />
          {showMap ? 'Drag to hide map' : 'Drag down for map'}
        </div>

        <div
          className="space-y-4 p-4"
          style={{ touchAction: 'pan-y', overscrollBehaviorY: 'contain' }}
          onPointerDown={handleBodyDragStart}
          onPointerMove={handleBodyDragMove}
          onPointerUp={handleBodyDragEnd}
          onPointerCancel={handleBodyDragEnd}
        >
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

          <SectionCard
            title="Completed"
            subtitle={`${completed.length} total · ₦${todayEarnings}`}
            right={completed.length > 0 && (
              <Link to="/rider/earnings" className="text-xs font-bold text-emerald-600 hover:text-emerald-500">
                View earnings
              </Link>
            )}
          >
            <CompletedList completed={completed} />
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

          <SectionCard
            title="Completed"
            subtitle={`${completed.length} total · ₦${todayEarnings}`}
            right={completed.length > 0 && (
              <Link to="/rider/earnings" className="text-xs font-bold text-emerald-600 hover:text-emerald-500">
                View earnings
              </Link>
            )}
          >
            <CompletedList completed={completed} />
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
