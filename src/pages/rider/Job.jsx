import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrandLoader } from '@/components/brand-loader'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Briefcase, CheckCircle2, Clock3, Hourglass, LoaderCircle, MapPin, PackageCheck, User, X } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { DeliveryMap } from '@/components/delivery-map'
import { TripCard } from '@/components/trip-card'
import { ChatPanel, ChatLauncher, useChatThread, ChatMessageList, ChatComposer } from '@/components/chat-panel'
import { MobileDrawer } from '@/components/mobile-drawer'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useStore, useCurrentUser, updateDeliveryStatus, STATUS_LABEL, upsertDelivery, mapOrder } from '@/lib/api-store'
import { getErrorMessage, getRiderJob } from '@/services/api'
import { getSocket } from '@/lib/socket'
import { useSimulatedCourierPosition } from '@/lib/use-simulated-courier'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

const NEXT = {
  accepted: { next: 'picked_up', label: 'Mark as picked up' },
  picked_up: { next: 'in_transit', label: 'Start trip' },
  in_transit: { next: 'delivered', label: 'Mark delivered' },
}

const TABS = [
  { id: 'requests', label: 'Requests' },
  { id: 'active', label: 'Active jobs' },
  { id: 'completed', label: 'Completed' },
]

export default function RiderJob() {
  const { id } = useParams()
  // Force a clean remount whenever the route moves between the job list
  // and a specific job (or between two different jobs). Without this, the
  // same component instance carries over local state/effect timers from
  // whatever was previously open, which is what made clicking a job card
  // sometimes land on a broken view until a hard refresh.
  return <RiderJobView key={id || 'list'} />
}

function RiderJobView() {
  const user = useRequireAuth('rider')
  const { user: currentUser } = useCurrentUser()
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [autoMove, setAutoMove] = useState(true)
  const [dismissedRequests, setDismissedRequests] = useState(() => new Set())
  const [chatOpen, setChatOpen] = useState(false)
  const [chatUnread, setChatUnread] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)
  // How much of the screen the mobile job-detail sheet is occupying (real
  // measured px, reported by MobileDrawer) — the background map is pushed
  // up by exactly this much, same pattern as Ride.jsx.
  const [sheetOffsetPx, setSheetOffsetPx] = useState(0)
  const [sheetDragging, setSheetDragging] = useState(false)
  const handleSheetHeightChange = useCallback((px, dragging = true) => {
    setSheetOffsetPx(px)
    setSheetDragging(Boolean(dragging))
  }, [])

  const searchParams = new URLSearchParams(location.search)
  const requestedTab = searchParams.get('tab')
  const activeTab = TABS.some((t) => t.id === requestedTab) ? requestedTab : 'requests'

  // Selecting the raw `deliveries` array and filtering/finding in the
  // render body (rather than inside the useStore selector) keeps this
  // always current. A useStore selector's cached value only recomputes on
  // the next store emit — one closed over `id`/`currentUser` could keep
  // returning "not found"/empty results after navigating here, until some
  // unrelated store update happened to fire an emit. That's what made
  // opening a job from its card sometimes look broken until a refresh.
  const deliveries = useStore((s) => s.deliveries)
  const delivery = deliveries.find((d) => String(d.id) === String(id))
  const [loadingJob, setLoadingJob] = useState(false)
  const [jobNotFound, setJobNotFound] = useState(false)

  // Mobile only: when the drawer is in chat mode, this drives the message
  // list (in the drawer body) and composer (pinned in the drawer footer).
  const mobileChatActive = Boolean(chatOpen && delivery && ['accepted', 'picked_up', 'in_transit'].includes(delivery.status))
  const mobileChat = useChatThread(delivery?.id, currentUser?.id, mobileChatActive)

  // Fallback fetch if opened directly or not yet present in store
  useEffect(() => {
    if (!id || delivery) return
    let active = true
    setLoadingJob(true)
    getRiderJob(id)
      .then((res) => {
        if (!active) return
        const fetched = res.job || res.delivery || res.order
        if (fetched) {
          upsertDelivery(mapOrder(fetched))
        } else {
          setJobNotFound(true)
        }
      })
      .catch(() => {
        if (active) setJobNotFound(true)
      })
      .finally(() => {
        if (active) setLoadingJob(false)
      })
    return () => { active = false }
  }, [id, delivery])

  const availableRequests = deliveries.filter((d) => d.status === 'pending' && (!d.riderId || d.riderId === currentUser?.id))
  const incoming = availableRequests.filter((d) => !dismissedRequests.has(d.id))
  const activeJobs = currentUser ? deliveries.filter((d) => d.riderId === currentUser.id && ['accepted', 'picked_up', 'in_transit'].includes(d.status)) : []
  const completed = user ? deliveries.filter((d) => d.riderId === user.id && d.status === 'delivered') : []
 const { position: simulatedCourier, arrived: hasArrived } = useSimulatedCourierPosition(delivery)
  useEffect(() => {
    if (!delivery || delivery.status !== 'in_transit' || !autoMove) return
    let frac = 0
    const iv = setInterval(() => {
      frac += 0.05
      if (frac >= 1) {
        clearInterval(iv)
      }
    }, 1500)
    return () => clearInterval(iv)
  }, [delivery?.status, id, autoMove])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !id || chatOpen) return
    const handler = (message) => {
      if (message.orderId === id && String(message.sender) !== String(currentUser?.id)) setChatUnread(true)
    }
    socket.on('chat:message', handler)
    return () => socket.off('chat:message', handler)
  }, [id, chatOpen, currentUser?.id])

  const visibleJobs = useMemo(() => {
    if (activeTab === 'active') return activeJobs
    if (activeTab === 'completed') return completed
    return incoming
  }, [activeTab, activeJobs, completed, incoming])

  // Loading state for detail view
  const [detailLoading, setDetailLoading] = useState(true)
  
  useEffect(() => {
    if (!id) return
    setDetailLoading(true)
    const timer = setTimeout(() => setDetailLoading(false), 300)
    return () => clearTimeout(timer)
  }, [id])

  if (!user) return <BrandLoader />

  // Show skeleton while loading detail
  if (id && (detailLoading || (loadingJob && !delivery))) {
    return (
      <AppShell hideMobileHeader>
        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-12">
          <aside className="space-y-6 lg:col-span-4">
            <SkeletonCard className="p-6" />
            <SkeletonCard className="p-6" />
          </aside>
          <section className="h-[50vh] overflow-hidden rounded-3xl border border-slate-200 sm:h-[60vh] lg:sticky lg:top-24 lg:col-span-8 lg:h-[calc(100vh-7rem)]">
            <Skeleton className="h-full w-full" />
          </section>
        </main>
      </AppShell>
    )
  }

  function handleBack() {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate('/rider')
    }
  }

  async function accept(jobId) {
    try {
      await updateDeliveryStatus(jobId, 'accepted')
      toast.success('Job accepted')
      navigate(`/rider/job/${jobId}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to accept this job.'))
    }
  }

  function reject(jobId) {
    setDismissedRequests((current) => {
      const next = new Set(current)
      next.add(jobId)
      return next
    })
    toast.message('Request hidden from your list')
  }

  if (!id) {
    return (
      <AppShell hideMobileHeader>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">Jobs</h1>
              <p className="mt-2 text-sm text-slate-500">Review requests, active trips, and completed work.</p>
            </div>
         
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(`/rider/job?tab=${tab.id}`)}
                className={`min-w-0 rounded-xl px-2 py-2.5 text-center text-[11px] font-bold transition-colors sm:text-sm ${
                  activeTab === tab.id ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="block truncate">{tab.label}</span>
              </button>
            ))}
          </div>

          <section className="space-y-3">
            {visibleJobs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">No jobs here</h2>
                <p className="mt-2 text-sm text-slate-500">Jobs will appear in this tab when they match this status.</p>
              </div>
            ) : (
              visibleJobs.map((job) => (
                <TripCard
                  key={job.id}
                  delivery={job}
                   actionLabel={activeTab === 'requests' ? 'Accept ride' : activeTab === 'active' ? 'Open' : 'View'}
                  actionTo={activeTab === 'requests' ? undefined : `/rider/job/${job.id}`}
                  onAction={activeTab === 'requests' ? () => accept(job.id) : undefined}
                  onSecondary={activeTab === 'requests' ? () => reject(job.id) : undefined}
                  disableNavigation={activeTab === 'requests'}
                />
              ))
            )}
          </section>
        </main>
      </AppShell>
    )
  }

  if (!delivery) {
    return (
      <AppShell>
        <main className="mx-auto max-w-md p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 mb-4">
            <Briefcase className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Job not found</h2>
          <p className="mt-1 text-sm text-slate-500">The requested job could not be found or is no longer available.</p>
          <button
            type="button"
            onClick={() => navigate('/rider')}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Back to Dashboard
          </button>
        </main>
      </AppShell>
    )
  }

  const nextStep = NEXT[delivery.status]
  // "Start trip" (picked_up -> in_transit) waits on the customer confirming
  // from their track page. The server enforces this too (see
  // rider.services.js) — this is just so the button reflects reality
  // instead of letting the rider tap it and get a rejected request.
  const waitingOnCustomer = delivery.status === 'picked_up' && delivery.type === 'ride' && !delivery.customerConfirmed
  const startTripBlocked = nextStep?.next === 'in_transit' && waitingOnCustomer
  // "Mark delivered" (in_transit -> delivered) waits for the simulated
  // drive to actually reach the dropoff — the same motion driving the car
  // on the map — so the button can't fire before the car has arrived.
 
  const deliveryBlocked = nextStep?.next === 'delivered' && !hasArrived

  const detailCards = (
    <>
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Job</p>
        <h2 className="mt-1 font-display text-2xl font-bold">{delivery.id}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {delivery.type === 'ride' ? `Ride · ${delivery.rideType || ''}` : `Delivery · ${delivery.packageType || ''}`} · {delivery.distanceKm} km · ₦{delivery.price}
        </p>

        <div className="mt-6 space-y-4">
          <JobDetail Icon={MapPin} label="Pickup" value={delivery.pickup.address} />
          <JobDetail Icon={MapPin} label="Dropoff" value={delivery.dropoff.address} />
          <JobDetail Icon={PackageCheck} label="Vehicle" value={delivery.rider?.plateNumber || delivery.plateNumber} />
          <div className="flex items-center justify-between gap-3">
            <JobDetail Icon={User} label="Customer" value={delivery.customerName} />
            {['accepted', 'picked_up', 'in_transit'].includes(delivery.status) && (
              <ChatLauncher hasUnread={chatUnread} onClick={() => { setChatOpen(true); setChatUnread(false) }} />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current status</p>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-600">
            {STATUS_LABEL[delivery.status]}
          </span>
        </div>

        {nextStep ? (
          <div className="space-y-3">
            {startTripBlocked && (
              <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700">
                <Hourglass className="h-3.5 w-3.5 shrink-0" /> Waiting for the customer to confirm on their track page — this unlocks automatically.
              </p>
            )}
            {deliveryBlocked && (
              <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700">
                <Hourglass className="h-3.5 w-3.5 shrink-0" /> Still on the way — this unlocks the moment you arrive at the dropoff.
              </p>
            )}
            <button
              disabled={startTripBlocked || deliveryBlocked || actionBusy}
              onClick={async () => {
                setActionBusy(true)
                try {
                  await updateDeliveryStatus(id, nextStep.next)
                  toast.success('Job updated')
                } catch (error) {
                  toast.error(getErrorMessage(error, 'Unable to update this job.'))
                  return
                } finally {
                  setActionBusy(false)
                }
                if (nextStep.next === 'in_transit') setAutoMove(true)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald-600"
            >
              {actionBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {nextStep.label}
            </button>
            {['accepted', 'picked_up', 'in_transit'].includes(delivery.status) && (
              <button
                disabled={cancelBusy}
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to cancel this job?')) return
                  setCancelBusy(true)
                  try {
                    await updateDeliveryStatus(id, 'cancelled')
                    toast.success('Job cancelled')
                    navigate('/rider/job')
                  } catch (error) {
                    toast.error(getErrorMessage(error, 'Unable to cancel this job.'))
                  } finally {
                    setCancelBusy(false)
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Cancel job
              </button>
            )}
          </div>
        ) : delivery.status === 'delivered' ? (
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Delivered successfully
            </p>
            <button
              onClick={() => navigate('/rider/job')}
              className="mt-4 w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-emerald-600"
            >
              Back to jobs
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No action available.</p>
        )}
      </div>
    </>
  )

  return (
    <AppShell  hideMobileHeader>
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        <aside className="hidden space-y-6 lg:col-span-4 lg:block">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex gap-2 items-center justify-center rounded-full  transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-6 w-6" /> <h3 className="font-display text-3xl font-bold tracking-tight text-slate-900">Jobs</h3>
          </button>

          {detailCards}
        </aside>

<section className="h-[50vh] hidden overflow-hidden rounded-3xl border border-slate-200 sm:h-[60vh] lg:sticky lg:block lg:top-24 lg:col-span-8 lg:h-[calc(100vh-7rem)]">
          <DeliveryMap
            pickup={delivery.pickup.coords}
            dropoff={delivery.dropoff.coords}
            courier={simulatedCourier}
            pickupAddress={delivery.pickup.address}
            dropoffAddress={delivery.dropoff.address}
            className="h-full w-full"
          />
        </section>

        {/* Mobile: full-bleed live map behind a draggable details sheet —
            same pattern as the active-ride view in customer/Ride.jsx. No
            floating map button here any more; the map is always the
            background, just revealed/covered as the sheet is dragged. */}
        <div className="lg:hidden">
          <div
            className="fixed inset-x-0 top-0 z-[100]"
            style={{ bottom: sheetOffsetPx, transition: sheetDragging ? 'none' : 'bottom 0.25s ease' }}
          >
            <DeliveryMap
              pickup={delivery.pickup.coords}
              dropoff={delivery.dropoff.coords}
              courier={simulatedCourier}
              pickupAddress={delivery.pickup.address}
              dropoffAddress={delivery.dropoff.address}
              className="h-full w-full"
            />
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          <MobileDrawer
            key={chatOpen ? 'chat' : 'details'}
            initialSnapIndex={chatOpen ? 2 : 1}
            onHeightChange={handleSheetHeightChange}
            footer={chatOpen ? (
              <ChatComposer
                text={mobileChat.text}
                setText={mobileChat.setText}
                sending={mobileChat.sending}
                onSend={mobileChat.handleSend}
                error={mobileChat.error}
              />
            ) : undefined}
          >
            {chatOpen ? (
              <div className="flex h-full min-h-0 flex-col">
                <div className="mb-3 flex shrink-0 items-center justify-between border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    onClick={() => { setChatOpen(false); setChatUnread(false) }}
                    className="flex items-center gap-2 text-sm font-bold text-slate-900"
                  >
                    <ArrowLeft className="h-4 w-4" /> {delivery.customerName || 'Customer'}
                  </button>
                </div>
                <ChatMessageList messages={mobileChat.messages} loaded={mobileChat.loaded} currentUserId={currentUser?.id} className="min-h-0 flex-1 overflow-y-auto" />
              </div>
            ) : (
              <div className="space-y-6">{detailCards}</div>
            )}
          </MobileDrawer>
        </div>

      {['accepted', 'picked_up', 'in_transit'].includes(delivery.status) && (
        <ChatPanel
          orderId={delivery.id}
          currentUserId={currentUser?.id}
          otherPartyLabel={delivery.customerName || 'Customer'}
          open={chatOpen}
          onOpenChange={setChatOpen}
        />
      )}
      </main>
    </AppShell>
  )
}

function JobMetric({ label, value, Icon }) {
  return (
    <div className="min-w-0 rounded-xl bg-white px-3 py-2 text-emerald-700 shadow-sm">
      <Icon className="mx-auto h-4 w-4" />
      <p className="mt-1 text-base font-black">{value}</p>
      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">{label}</p>
    </div>
  )
}

function JobDetail({ Icon, label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Icon className="h-3 w-3 text-emerald-600" /> {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}
