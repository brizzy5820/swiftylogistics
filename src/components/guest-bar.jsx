import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Car, ChevronDown, ChevronUp, History, PackagePlus, UserRound } from 'lucide-react'
import { getGuestSession, setGuestSession, getGuestActivities } from '@/lib/api-store'

/**
 * GuestBar — the "continue without an account" entry point.
 *
 * It is deliberately only a button. No email or phone is collected here: that
 * happens at the last moment, inside the booking flow itself, right before the
 * rider search starts (after a ride is picked / a delivery is confirmed) — and
 * it is asked for on every ride, which is exactly what separates a guest from a
 * signed-in customer.
 *
 * Everything a guest does lives in this device's localStorage (see the guest
 * session in api-store), while each order is also posted to the API so riders
 * can see and accept it. Signing in with the same email later on THIS device
 * hands that history to the account; any other device starts fresh.
 */
export function GuestBar({ compact = false }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [session, setSession] = useState(() => getGuestSession())
  const [expanded, setExpanded] = useState(false)

  const activityCount = session ? getGuestActivities().length : 0

  // Whoever tapped "Proceed as guest" gets to carry on with whatever they came
  // here to do — landing on /auth from a ride attempt means resuming that ride
  // attempt. Guests are customers only, so a rider destination still lands on
  // the customer dashboard.
  function destination() {
    const from = typeof state?.from === 'string' ? state.from : null
    if (from && from.startsWith('/customer')) return from
    return '/customer'
  }

  function proceed() {
    if (!session) setSession(setGuestSession(null, null))
    // Forward the intent the guest arrived with — e.g. the pickup/dropoff they
    // typed on the landing page — so the ride page opens already filled in.
    navigate(destination(), { state: state?.intent ?? null })
  }

  if (!session) {
    return (
      <button
        type="button"
        onClick={proceed}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <UserRound className="h-4 w-4" />
        Proceed as guest
      </button>
    )
  }

  return (
    <div
      onClick={() => setExpanded((value) => !value)}
     className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <UserRound className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
            {session.email || 'Guest'}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            Booking on this device
            {activityCount > 0 && ` · ${activityCount} ${activityCount === 1 ? 'trip' : 'trips'}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800"
          aria-label={expanded ? 'Hide guest trips' : 'Show guest trips'}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/customer/ride"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500"
          >
            <Car className="h-3.5 w-3.5" /> Book a ride
          </Link>
          <Link
            to="/customer/book"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-400"
          >
            <PackagePlus className="h-3.5 w-3.5" /> Send a package
          </Link>
        </div>
      )}
    </div>
  )
}

export default GuestBar
