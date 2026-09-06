import { CarFront, Clock3, MapPin, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MOCK_RIDES } from '../../data/mock-data'

export function ActiveRideCard() {
  const ride = MOCK_RIDES.find((item) => item.status === 'in_progress')
  if (!ride) return null
  return <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
      <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">On the way</p><h2 className="mt-1 font-display text-lg font-bold">Your ride is moving</h2></div>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{ride.eta} min</span>
    </div>
    <div className="grid lg:grid-cols-[1fr_280px]">
      <div className="relative min-h-[220px] overflow-hidden bg-emerald-50">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(30deg, transparent 48%, #bbf7d0 49%, #bbf7d0 51%, transparent 52%), linear-gradient(120deg, transparent 48%, #bbf7d0 49%, #bbf7d0 51%, transparent 52%)', backgroundSize: '70px 70px' }} />
        <div className="absolute left-[18%] top-[60%] h-3 w-3 rounded-full bg-emerald-700 ring-8 ring-emerald-700/10" />
        <div className="absolute right-[18%] top-[27%] h-3 w-3 rounded-full bg-slate-950 ring-8 ring-slate-950/10" />
        <div className="absolute left-[20%] top-[57%] h-0.5 w-[60%] rotate-[-23deg] origin-left bg-emerald-600" />
        <div className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur"><Navigation className="mr-1 inline h-3.5 w-3.5 text-emerald-600" /> Live route</div>
      </div>
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100"><CarFront className="h-5 w-5" /></div><div><p className="text-sm font-bold">{ride.driver}</p><p className="text-xs text-slate-500">{ride.vehicle}</p></div></div>
        <div className="space-y-3 text-sm"><div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-emerald-600" /><span>{ride.pickup}</span></div><div className="ml-2 h-5 border-l border-dashed border-slate-300" /><div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-slate-900" /><span>{ride.dropoff}</span></div></div>
        <Link to={`/customer/track/${ride.id}`} className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"><Clock3 className="h-4 w-4" /> View trip</Link>
      </div>
    </div>
  </section>
}
