import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CarFront, MapPin, Clock3, Navigation } from 'lucide-react'
import { useStore } from '../../lib/api-store'
import { DeliveryMap } from '../delivery-map'

export function RideTracker() {
  const user = useStore((s) => s.session ? s.users.find((u) => u.id === s.session.userId) : null)
  const deliveries = useStore((s) => s.deliveries)
  const users = useStore((s) => s.users)

  const latestRide = useMemo(() => {
    if (!user) return null
    const rides = deliveries
      .filter((d) => d.customerId === user.id && d.type === 'ride')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    return rides[0] || null
  }, [deliveries, user])

  const isActive = latestRide && !['delivered', 'cancelled'].includes(latestRide.status)
  const pickup = latestRide?.pickup?.coords
  const dropoff = latestRide?.dropoff?.coords
  const courier = isActive ? latestRide?.courierPosition : null
  const rider = latestRide?.riderId ? users.find((u) => u.id === latestRide.riderId) : null
  const courierInfo = {
    riderName: latestRide?.riderName || 'Driver en route',
    rideType: latestRide?.rideType,
    plateNumber: rider?.plateNumber,
    phone: rider?.phone,
  }

  const directionsUrl = useMemo(() => {
    if (!pickup || !dropoff) return '#'
    return `https://www.google.com/maps/dir/?api=1&origin=${pickup.lat},${pickup.lng}&destination=${dropoff.lat},${dropoff.lng}`
  }, [pickup, dropoff])

  if (!latestRide) {
    return (
      <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70 overflow-hidden">
        <div className="relative h-44 w-full overflow-hidden sm:h-52">
          <img src="/noride.png" alt="No ride yet" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-base font-bold text-white sm:text-lg">No Ride Yet</p>
            <p className="mt-0.5 text-xs text-white/80">Book a ride to get started</p>
          </div>
        </div>
        <div className="p-5">
          <Link to="/customer/ride" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500">
            <CarFront className="h-4 w-4" /> Book a ride
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            {isActive ? 'On the way' : 'Latest ride'}
          </p>
          <h2 className="mt-1 font-display text-lg font-bold">
            {isActive ? 'Your ride is moving' : 'Ride completed'}
          </h2>
        </div>
        {isActive && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {latestRide.etaMinutes} min
          </span>
        )}
      </div>

      {isActive && pickup && dropoff ? (
        <div className="relative h-52 w-full overflow-hidden">
          <DeliveryMap
            pickup={pickup}
            dropoff={dropoff}
            courier={courier}
            courierInfo={courierInfo}
            destination={dropoff}
            className="h-full w-full"
          />
       
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center bg-slate-50">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs text-slate-400">Route completed</p>
          </div>
        </div>
      )}

      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <CarFront className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold">{latestRide.riderName || 'Driver assigned'}</p>
            <p className="text-xs text-slate-500">{latestRide.rideType || 'Ride'}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span className="truncate">{latestRide.pickup?.address || 'Pickup location'}</span>
          </div>
          <div className="ml-1.5 h-4 w-px bg-slate-200" />
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
            <span className="truncate">{latestRide.dropoff?.address || 'Dropoff location'}</span>
          </div>
        </div>

        {isActive && (
          <Link
            to={`/customer/track/${latestRide.id}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Clock3 className="h-4 w-4" /> View trip
          </Link>
        )}
      </div>
    </div>
  )
}
