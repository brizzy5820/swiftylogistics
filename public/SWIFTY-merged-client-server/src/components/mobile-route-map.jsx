import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { DeliveryMap } from './delivery-map'

export function MobileRouteMap({ pickup, dropoff, courier, courierInfo, destination, activeLabel, description }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-xl ring-2 ring-blue-300"
          aria-label="Show route map"
        >
          <div className="pointer-events-none h-full w-full">
            <DeliveryMap
              pickup={pickup}
              dropoff={dropoff}
              courier={courier}
              courierInfo={courierInfo}
              destination={destination}
              className="h-full w-full"
            />
          </div>
          <div className="absolute inset-0 flex items-end justify-center rounded-full bg-gradient-to-t from-black/40 to-transparent pb-1.5">
            <span className="text-[8px] font-bold uppercase tracking-widest text-white">Map</span>
          </div>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] bg-slate-100 lg:hidden">
          <DeliveryMap
            pickup={pickup}
            dropoff={dropoff}
            courier={courier}
            courierInfo={courierInfo}
            destination={destination}
            className="h-full w-full"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Back to details"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="max-w-[70%] truncate rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur">
              {activeLabel || 'Route preview'}
            </div>
          </div>
          {description && (
            <div className="absolute bottom-6 left-4 max-w-[calc(100%-2rem)] truncate rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur">
              {description}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export function RouteMapPanel({ pickup, dropoff, courier, courierInfo, destination, activeLabel }) {
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
          className="h-full w-full"
        />
      </div>
    </div>
  )
}
