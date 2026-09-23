import { useEffect, useRef } from 'react'
import { AlertCircle, ArrowRight, RefreshCw, User, X } from 'lucide-react'

// Shared with the delivery booking flow (Book.jsx) — the exact same
// "searching / rider found / no rider found" card, driven purely by props
// so either flow's own search logic (active poll-and-assign for rides,
// passive store-watch for deliveries) can reuse it unchanged.
export const SEARCH_COUNTDOWN_MS = 60000

export function RiderSearchDrawer({ rider, onCancel, onConfirm, onHeightChange, onRetry, timedOut, countdown }) {
  const cardRef = useRef(null)

  const progress = countdown ? countdown / (SEARCH_COUNTDOWN_MS / 1000) : 0

  const riderContent = rider ? (
    <div className="p-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Rider found</p>
        <button onClick={onCancel} aria-label="Close"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700">
          {rider.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-black text-slate-950">{rider.name}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{rider.vehicleType || 'Swifty rider'}{rider.plateNumber ? ` · ${rider.plateNumber}` : ''}</p>
          {rider.phone && <p className="mt-0.5 text-xs text-slate-400">{rider.phone}</p>}
        </div>
        <span className="text-sm font-bold text-amber-500">★ {rider.rating || '5.0'}</span>
      </div>
    </div>
  ) : timedOut ? (
    <div className="p-1 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="font-display text-xl font-black text-slate-950">No rider found</h2>
      <p className="mt-1 text-sm text-slate-500">We couldn't find an available rider near you right now.</p>
      <div className="mt-6">
        <button
          type="button"
          onClick={onRetry}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    </div>
  ) : (
    <div className="p-1">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center item-center rounded-full bg-gray-100 text-gray-600">
          <User className="h-7 w-7 " />
        </div>
        <div>
          <h2 className="font-display text-xl font-black text-slate-950">Finding a rider</h2>
          <p className="mt-1 text-sm text-slate-500">We are checking registered riders near your pickup.</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Searching for riders...</span>
          <span className="font-mono text-semibold text-lg text-black">00:{countdown}s</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-slate-100" aria-label="Searching for a rider">
          <div 
            className="h-full bg-emerald-500 transition-all duration-1000 ease-linear" 
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )

  const footer = rider ? (
    <button type="button" onClick={onConfirm} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400">
      Confirm ride <ArrowRight className="h-4 w-4" />
    </button>
  ) : timedOut ? null : (
    <button type="button" onClick={onCancel} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50">
      <X className="h-4 w-4" /> Cancel search
    </button>
  )

  // Lock the background page while this card is open.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevBodyOverscroll = body.style.overscrollBehavior
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.overscrollBehavior = prevBodyOverscroll
    }
  }, [])

  // Report the card's real, content-driven height (px) so the map behind it
  // can stay clear of it — recalculates automatically when content changes,
  // e.g. switching from "searching" to "rider found".
  useEffect(() => {
    if (!onHeightChange || !cardRef.current) return
    const el = cardRef.current
    const report = () => onHeightChange(el.getBoundingClientRect().height, false)
    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  }, [onHeightChange, rider])

  useEffect(() => {
    return () => onHeightChange?.(0, false)
  }, [onHeightChange])

  return (
    <>
      {/* Mobile: compact card sized to its content — never a big empty sheet. */}
      <div className="fixed inset-x-0 bottom-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={rider ? 'Confirm rider' : 'Finding a rider'}>
        <button type="button" onClick={onCancel} className="absolute inset-0 h-full w-full bg-slate-950/25" aria-label="Close" />
        <div
          ref={cardRef}
          className="relative mx-auto max-h-[75vh] w-full overflow-y-auto overscroll-contain touch-pan-y rounded-t-3xl bg-white p-5 shadow-2xl"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
          {riderContent}
          <div className="mt-5">{footer}</div>
        </div>
      </div>

      {/* Desktop: centered dialog, unaffected by mobile sizing. */}
      <div className="fixed inset-0 z-[60] hidden items-center justify-center bg-slate-950/35 p-4 lg:flex" role="dialog" aria-modal="true" aria-label={rider ? 'Confirm rider' : 'Finding a rider'}>
        <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
          {riderContent}
          <div className={rider ? 'mt-1' : 'mt-5'}>{footer}</div>
        </div>
      </div>
    </>
  )
}
