import { useStore } from '../../lib/mock-store'

export function ActiveRideCard() {
  const ride = useStore((state) => state.deliveries.find((item) => item.type === 'ride' && item.status === 'in_transit'))
  if (!ride) return null
  return <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
    <div className="p-6"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">On the way</p><h2 className="mt-1 font-display text-lg font-bold">Your ride is moving</h2><p className="mt-3 text-sm text-slate-500">{ride.pickup?.address} to {ride.dropoff?.address}</p></div>
  </section>
}
