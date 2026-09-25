import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { DeliveryMap, API_KEY } from './delivery-map'
import { RiderMap, OnlineBadge } from './rider-map'
import { ShimmerImage } from './shimmer-image'

// A tiny 64px floating button has no business booting the full Google Maps
// JS SDK just to render a thumbnail — that's real, avoidable load. Show a
// static map image instead; the live, interactive map only mounts once the
// button is actually tapped and the full-screen view opens.
function staticMapUrl(pickup, dropoff) {
  if (!API_KEY || !pickup) return null
  const markers = [
    `markers=color:0x10B981%7Clabel:A%7C${pickup.lat},${pickup.lng}`,
    dropoff ? `markers=color:0x0F172A%7Clabel:B%7C${dropoff.lat},${dropoff.lng}` : null,
  ].filter(Boolean).join('&')
  return `https://maps.googleapis.com/maps/api/staticmap?size=160x160&scale=2&maptype=roadmap&${markers}&key=${API_KEY}`
}

export function MobileRouteMap({
  jobs,
  onAccept,
  pickup,
  dropoff,
  courier,
  courierInfo,
  destination,
  pickupAddress,
  dropoffAddress,
  activeLabel,
  description,
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-xl transition-transform active:scale-95"
          aria-label="Show route map"
        >
          <div className="absolute left-1/2 top-2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-white/95 p-1 shadow-md">
            <img
              src="https://www.gstatic.com/images/branding/product/2x/maps_96dp.png"
              alt="Google Maps"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="absolute inset-0 flex items-end justify-center rounded-full pb-1.5">
            <span className="text-[8px] font-bold uppercase tracking-widest text-black">Map</span>
          </div>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] bg-slate-100 lg:hidden">
          {jobs ? (
            <div className="relative h-full w-full">
              <RiderMap
                jobs={jobs}
                onAccept={(id) => {
                  setOpen(false)
                  onAccept?.(id)
                }}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/20 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-950/25 to-transparent" />
              <div className="absolute right-4 top-4">
                <OnlineBadge light jobCount={jobs.length} />
              </div>
            </div>
          ) : (
            <DeliveryMap
              pickup={pickup}
              dropoff={dropoff}
              courier={courier}
              courierInfo={courierInfo}
              destination={destination}
              pickupAddress={pickupAddress}
              dropoffAddress={dropoffAddress}
              className="h-full w-full"
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Back to details"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {!jobs && (
              <div className="max-w-[70%] truncate rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur">
                {activeLabel || 'Route preview'}
              </div>
            )}
          </div>
          {!jobs && description && (
            <div className="absolute bottom-6 left-4 max-w-[calc(100%-2rem)] truncate rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur">
              {description}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export function RouteMapPanel({ pickup, dropoff, courier, courierInfo, destination, pickupAddress, dropoffAddress, activeLabel }) {
  return (
    <div className="sticky top-6 h-full min-h-[520px]">
      <div className="relative h-full min-h-[520px] overflow-hidden rounded-3xl border border-slate-200">
        {activeLabel && (
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {activeLabel}
          </div>
        )}
        <DeliveryMap
          pickup={pickup}
          dropoff={dropoff}
          courier={courier}
          courierInfo={courierInfo}
          destination={destination}
          pickupAddress={pickupAddress}
          dropoffAddress={dropoffAddress}
          className="h-full w-full"
        />
      </div>
    </div>
  )
}
