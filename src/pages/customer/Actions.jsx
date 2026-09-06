import { Link } from 'react-router-dom'
import { ArrowUpRight, Bike, Calendar, CarFront, MapPin, PackageCheck, Search, Send } from 'lucide-react'
import { useStore } from '../../lib/mock-store'
import { useRequireAuth } from '../../lib/use-require-auth'
import { AppShell } from '../../components/app-shell'

const ACTIONS = [
  { to: '/customer/ride', title: 'Book a ride', subtitle: 'A car is minutes away', primary: true, image: '/ride.png', Icon: CarFront },
  { to: '/customer/book', title: 'Send a package', subtitle: 'Pickup and delivery now', image: '/deliveryguy.png', Icon: PackageCheck },
  { to: '/customer/schedule', title: 'Schedule delivery', subtitle: 'Plan it for later', image: '/pickedup.png', Icon: Calendar },
  { to: '/customer/book?mode=intercity', title: 'Intercity delivery', subtitle: 'Across town or further', image: '/bgimg.png', Icon: Send },
  { to: '/customer/book?mode=cargo', title: 'Cargo & large items', subtitle: 'Bigger loads, same care', image: '/blush.png', Icon: PackageCheck },
  { to: '/customer/track', title: 'Track an order', subtitle: 'Follow it live', image: '/formimg.png', Icon: MapPin },
]

export default function Actions() {
  useRequireAuth('customer')
  const user = useRequireAuth('customer')
  const firstName = user?.name?.split(' ')[0] || 'there'
  const scheduled = useStore((s) => (s.scheduled ?? []).filter((sc) => sc.customerId === user?.id).sort((a, b) => a.scheduledFor - b.scheduledFor))
  const activeDeliveries = useStore((s) => s.deliveries.filter((d) => d.customerId === user?.id && !['delivered', 'cancelled'].includes(d.status)).length)

  return (
    <AppShell hideMobileHeader>
      <main className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl">Hi {firstName}</h1>
            <p className="mt-1 text-sm text-slate-500">Everything you can do on Swifty in one place.</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Where to?"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold shadow-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          {/* Hero card */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white">
            <div className="relative z-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Quick start</p>
                <h2 className="mt-2 font-display text-2xl font-black tracking-tight sm:text-3xl">Move something today</h2>
                <p className="mt-1 text-sm text-slate-400">{activeDeliveries} active · {scheduled.length} scheduled</p>
              </div>
              <Link to="/customer/ride" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-400">
                Book a ride <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* All actions grid */}
          <section>
            <h3 className="mb-3 font-display text-lg font-bold">Suggestions</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ACTIONS.map((a) => (
                <Link
                  key={a.title}
                  to={a.to}
                  className={`group flex flex-col gap-3 overflow-hidden rounded-2xl border p-3 transition hover:-translate-y-0.5 ${
                    a.primary
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'border-slate-200 bg-white text-slate-900 hover:shadow-lg'
                  }`}
                >
                  <span className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl ${a.primary ? 'bg-white/15' : 'bg-emerald-50'}`}>
                    <img src={a.image} alt="" className="h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{a.title}</span>
                    <span className={`mt-0.5 block truncate text-xs ${a.primary ? 'text-emerald-50' : 'text-slate-500'}`}>{a.subtitle}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Upcoming scheduled */}
          {scheduled.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">Upcoming scheduled</h3>
                <Link to="/customer/schedule" className="text-sm font-bold text-emerald-700">Manage</Link>
              </div>
              <div className="space-y-2">
                {scheduled.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <Calendar className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{s.pickup?.address} → {s.dropoff?.address}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {new Date(s.scheduledFor).toLocaleString()} · {s.packageType} · {s.id}
                      </p>
                    </div>
                    <Link to="/customer/schedule" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  )
}
