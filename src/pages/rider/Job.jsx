import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Briefcase, CheckCircle2, Clock3, MapPin, PackageCheck, User } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { DeliveryMap } from '@/components/delivery-map'
import { TripCard } from '@/components/trip-card'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useStore, updateDeliveryStatus, advanceCourier, STATUS_LABEL } from '@/lib/mock-store'

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
  const user = useRequireAuth('rider')
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [autoMove, setAutoMove] = useState(true)

  const searchParams = new URLSearchParams(location.search)
  const requestedTab = searchParams.get('tab')
  const activeTab = TABS.some((t) => t.id === requestedTab) ? requestedTab : 'requests'

  const delivery = useStore((s) => s.deliveries.find((d) => d.id === id))
  const incoming = useStore((s) => s.deliveries.filter((d) => d.status === 'pending' && (!d.riderId || d.riderId === user?.id)))
  const activeJobs = useStore((s) =>
    user ? s.deliveries.filter((d) => d.riderId === user.id && ['accepted', 'picked_up', 'in_transit'].includes(d.status)) : [],
  )
  const completed = useStore((s) =>
    user ? s.deliveries.filter((d) => d.riderId === user.id && d.status === 'delivered') : [],
  )

  useEffect(() => {
    if (!delivery || delivery.status !== 'in_transit' || !autoMove) return
    let frac = 0
    const iv = setInterval(() => {
      frac += 0.05
      if (frac >= 1) {
        clearInterval(iv)
      } else {
        advanceCourier(id, frac)
      }
    }, 1500)
    return () => clearInterval(iv)
  }, [delivery?.status, id, autoMove])

  const visibleJobs = useMemo(() => {
    if (activeTab === 'active') return activeJobs
    if (activeTab === 'completed') return completed
    return incoming
  }, [activeTab, activeJobs, completed, incoming])

  if (!user) return null

  function handleBack() {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate('/rider')
    }
  }

  function accept(jobId) {
    updateDeliveryStatus(jobId, 'accepted', user.id, user.name)
    navigate('/rider/job?tab=active')
  }

  function reject(jobId) {
    updateDeliveryStatus(jobId, 'cancelled')
  }

  if (!id) {
    return (
      <AppShell>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button> */}

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
        <main className="p-12 text-center text-slate-500">Job not found.</main>
      </AppShell>
    )
  }

  const nextStep = NEXT[delivery.status]

  return (
    <AppShell>
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Job</p>
            <h2 className="mt-1 font-display text-2xl font-bold">{delivery.id}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {delivery.type === 'ride' ? `Ride · ${delivery.rideType || ''}` : `Delivery · ${delivery.packageType || ''}`} · {delivery.distanceKm} km · ₦{delivery.price}
            </p>

            <div className="mt-6 space-y-4">
              <JobDetail Icon={MapPin} label="Pickup" value={delivery.pickup.address} />
              <JobDetail Icon={MapPin} label="Dropoff" value={delivery.dropoff.address} />
              <JobDetail Icon={User} label="Customer" value={delivery.customerName} />
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
              <button
                onClick={() => {
                  updateDeliveryStatus(id, nextStep.next)
                  if (nextStep.next === 'in_transit') setAutoMove(true)
                }}
                className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
              >
                {nextStep.label}
              </button>
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
        </aside>

        <section className="h-[50vh] overflow-hidden rounded-3xl border border-slate-200 sm:h-[60vh] lg:sticky lg:top-24 lg:col-span-8 lg:h-[calc(100vh-7rem)]">
          <DeliveryMap
            pickup={delivery.pickup.coords}
            dropoff={delivery.dropoff.coords}
            courier={delivery.courierPosition}
            className="h-full w-full"
          />
        </section>
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
  return (
    <div>
      <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Icon className="h-3 w-3 text-emerald-600" /> {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}
