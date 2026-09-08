import { useMemo } from 'react'
import { ArrowRight, Clock, PackageCheck, Search, ClipboardClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/app-shell'
import { ServiceActions } from '../../components/dashboard/ServiceActions'
import { RideTracker } from '../../components/dashboard/RideTracker'
import { useRequireAuth } from '../../lib/use-require-auth'
import { useStore } from '../../lib/mock-store'

const PLAN_CARDS = [
  { title: 'Book a ride', subtitle: 'A car is minutes away, day or night', image: '/formimg.png' },
  { title: 'Send a delivery', subtitle: 'Package pickup and drop-off in minutes', image: '/deliveryguy.png' },
  { title: 'Track an order', subtitle: 'Follow it live, every step of the way', image: '/plan-track.png' },
]

export default function CustomerDashboard() {
  const user = useRequireAuth('customer')
  const deliveries = useStore((s) => user ? s.deliveries.filter((d) => d.customerId === user.id) : [])
  if (!user) return null
  const firstName = user.name.split(' ')[0]
  const recent = deliveries.slice(0, 2)

  return <AppShell>
    <main className=" px-4 py-6 sm:px-6 hidden lg:block  lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <div className="rounded-3xl bg-emerald-700 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div><h1 className="mt-2 max-w-xl font-display text-3xl font-black tracking-tight sm:text-4xl">Good to see you, {firstName} </h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">Ride across town, send a package, or track something already on its way.</p></div>
            </div>
            <div className="mt-8 flex max-w-xl items-center gap-3 rounded-2xl bg-white/10 p-2 ring-1 ring-white/10"><Search className="ml-2 h-4 w-4 text-slate-400" /><input placeholder="Search destination, tracking ID or service" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-slate-300" /><button className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900">Search</button></div>
          </div>
          <ServiceActions />
          <section><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Your activity</p><h2 className="mt-1 font-display text-xl font-bold">Recent orders</h2></div><Link to="/customer/history" className="text-sm font-bold text-emerald-700">See all</Link></div><div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">{recent.length ? recent.map((item) => <Link key={item.id} to={`/customer/track/${item.id}`} className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-0 hover:bg-slate-50"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><PackageCheck className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.pickup.address} → {item.dropoff.address}</span><span className="mt-1 block text-xs text-slate-500">{item.trackingId} · {item.status.replaceAll('_', ' ')}</span></span><ArrowRight className="h-4 w-4 text-slate-400" /></Link>) : <div className="p-8 text-center text-sm text-slate-500">Your recent orders will appear here.</div>}</div></section>
        </section>
        <aside className="order-self lg:order-none">
          <div className="lg:sticky lg:top-24">
            <RideTracker />
          </div>
        </aside>
      </div>
    </main>

    <main className="flex flex-col px-4 lg:hidden py-2 sm:px-6 w-full">
      <section className="flex hidden items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Good to see you</p>
          <h1 className="font-display text-2xl font-black tracking-tight">{firstName}</h1>
        </div>
      </section>
      {/* INput */}
  <section className="flex items-center gap-2 rounded-full bg-gray-200 px-4 ring-2 ring-transparent transition focus-within:bg-white focus-within:ring-emerald-600">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          className="w-full flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-slate-500"
          type="text"
          placeholder="Where to?"
        />
        <button
          type="button"
          aria-label="Schedule for later"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
        >
          <ClipboardClock  className="h-4 w-4" />
        </button>
      </section>
{/* Activity */}
    {
     recent.length > 0 &&(
         <section className='mt-2'>
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/50">
        <div className=" p-3 flex items-center justify-between">
          <p className="font-display text-lg font-bold">Recent activity</p>
          <Link to="/customer/history" className="text-sm font-bold text-emerald-700">See all</Link>
        </div>

          {recent.length ? recent.map((item) => (
            <Link
              key={item.id}
              to={`/customer/track/${item.id}`}
              className="flex items-center gap-3 p-3 hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <PackageCheck className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {item.pickup.address} → {item.dropoff.address}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {item.trackingId} · {item.status.replaceAll('_', ' ')}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          )) : (
            <div className="flex hidden items-center gap-3 p-3">
              <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img src="/empty-activity.png" alt="" className="h-full w-full object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">No activity yet</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Your rides and deliveries will show up here.
                </span>
              </span>
            </div>
          )}
        </div>
      </section>

      ) 
     }
    
{/* Actions */}
      <section className={recent.length > 0 ? 'mt-4' : 'mt-8'}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-lg font-bold">Suggestions</p>
          <span className="flex items-center gap-1 text-sm font-bold text-emerald-700">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <ServiceActions />
      </section>

      <section className='mt-4'>
        <p className="mb-3 font-display text-lg font-bold">Ways to get started</p>
        <div className="scrollbar-hide  flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
          {PLAN_CARDS.map((card) => (
            <div
              key={card.title}
              className="relative h-40 w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl"
            >
              <img src={card.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-sm font-bold text-white">{card.title}</p>
                <p className="mt-0.5 text-xs text-white/80">{card.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  </AppShell>
}