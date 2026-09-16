import { Link, useNavigate } from 'react-router-dom'
import { Clock, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABEL, useStore } from '@/lib/mock-store'
import { cn } from '@/lib/utils'

const STATUS_VARIANT = {
  pending: 'pending',
  accepted: 'progress',
  picked_up: 'progress',
  in_transit: 'progress',
  delivered: 'success',
  cancelled: 'muted',
}

export function TripCard({
  delivery,
  actionLabel,
  actionTo,
  onAction,
  secondaryLabel = 'Decline',
  onSecondary,
  onBeforeNavigate,
  onClick,
  className,
  disableNavigation = false,
}) {
  const d = delivery
  const navigate = useNavigate()
  const role = useStore((s) => s.session?.role)

  const isDelivered = d.status === 'delivered'
  const label = actionLabel ?? (isDelivered ? 'Completed' : 'Track')
  const actionClassName = cn(
    'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
    isDelivered
      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
      : 'bg-emerald-600 text-white hover:bg-emerald-500',
  )

  // Where the whole card goes when clicked — falls back to trackingId, then id,
  // so this still works for cards that don't pass an explicit actionTo.
  const trackTo = actionTo ?? (role === 'rider' ? `/rider/job/${d.trackingId}` : `/customer/track/${d.trackingId }`)

  function handleCardClick() {
    if (disableNavigation) return

    // If a parent passes its own onClick (e.g. History.jsx opening a details
    // modal), that parent owns the click entirely — don't also navigate, or
    // you get "modal opens, then immediately routes away" as both fire.
    if (onClick) {
      onClick(d)
      return
    }
    onBeforeNavigate?.()
    navigate(trackTo)
  }

  // Stop the inner action from also triggering the card's own onClick —
  // this is the "Link inside a clickable wrapper" double-nav issue.
  function handleActionClick(e) {
    e.stopPropagation()
    onAction?.(e)
  }

  function handleSecondaryClick(e) {
    e.stopPropagation()
    onSecondary?.(e)
  }

  return (
    <div
      onClick={handleCardClick}
      role={disableNavigation ? undefined : 'button'}
      tabIndex={disableNavigation ? undefined : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors',
        disableNavigation ? 'cursor-default' : 'cursor-pointer hover:border-blue-200',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">{d.trackingId}</p>
        <Badge variant={STATUS_VARIANT[d.status] ?? 'muted'}>{STATUS_LABEL[d.status] ?? d.status}</Badge>
      </div>

      <div className="mt-3 flex gap-3">
        <div className="flex flex-col items-center pt-1">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">A</span>
          <span className="my-1 w-px flex-1 bg-slate-200" />
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">B</span>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="truncate text-sm text-slate-700">{d.pickup?.address}</p>
          <p className="truncate text-sm text-slate-700">{d.dropoff?.address}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {d.etaMinutes != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {d.etaMinutes}m
            </span>
          )}
          {d.distanceKm != null && <span>{d.distanceKm} km</span>}
          {d.price != null && <span className="font-semibold text-slate-700">₦{d.price}</span>}
        </div>

        {/* Inner action is optional now — the whole card already navigates on click.
            If you keep passing actionTo/onAction, this stays as a secondary explicit
            button but no longer double-fires navigation. */}
        <div className="flex shrink-0 items-center gap-2">
          {onSecondary && (
            <button
              type="button"
              onClick={handleSecondaryClick}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-100"
              aria-label={secondaryLabel}
              title={secondaryLabel}
            >
              <X className="h-3.5 w-3.5" />
              {secondaryLabel}
            </button>
          )}
          {actionTo ? (
            <Link
              to={actionTo}
              onClick={(e) => {
                e.stopPropagation()
                onBeforeNavigate?.()
              }}
              className={actionClassName}
             
            >
              {label}
            </Link>
          ) : onAction ? (
            <button type="button" onClick={handleActionClick} className={actionClassName}>
              {label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
