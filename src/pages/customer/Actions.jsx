import { Link } from 'react-router-dom'
import { ArrowUpRight, Bike, Calendar, CarFront, MapPin, PackageCheck, Search, Send } from 'lucide-react'
import { useStore } from '../../lib/api-store'
import { useRequireAuth } from '../../lib/use-require-auth'
import { AppShell } from '../../components/app-shell'

const ACTIONS = [
  { to: '/customer/ride', title: 'Book a ride', subtitle: 'A car is minutes away', image: '/carinterface.png', Icon: CarFront },
  { to: '/customer/book', title: 'Send a package', subtitle: 'Pickup & delivery', image: '/deliveryinterface.png', Icon: PackageCheck },
  { to: '/customer/schedule', title: 'Schedule delivery', subtitle: 'Plan it for later', image: '',Icon: Calendar },
  { to: '/customer/track', title: 'Track an order', subtitle: 'Follow it live', image: '/trackinterface.png', Icon: MapPin },
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
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
              Actions
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Everything you can do on Swifty in one place.
            </p>
          </div>
          {/* All actions grid */}
          <section className=" flex lg:block justify-center w-full pt-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex justify-between">
              {ACTIONS.map((a) => (
                <Link
                  key={a.title}
                  to={a.to}
                  className={`group flex flex-col gap-3 overflow-hidden p-3 transition hover:-translate-y-0.5 
                  `}
                >
                  <span
                    className={`flex h-26 w-26 items-center justify-center overflow-hidden rounded-2xl p-3 bg-gray-100 text-slate-900 hover:shadow-lg ${a.primary ? "text-white/15" : "text-emerald-50"}`}
                  >
                    <img src={a.image} alt="" className="h-full w-full object-contain " />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{a.title}</span>
                    {/* <span className={`mt-0.5 block truncate text-xs ${a.primary ? 'text-emerald-50' : 'text-slate-500'}`}>{a.subtitle}</span> */}
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
                <Link to="/customer/schedule" className="text-sm font-bold text-emerald-700">
                  Manage
                </Link>
              </div>
              <div className="space-y-2">
                {scheduled.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <Calendar className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {s.pickup?.address} → {s.dropoff?.address}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {new Date(s.scheduledFor).toLocaleString()} · {s.packageType} · {s.id}
                      </p>
                    </div>
                    <Link
                      to="/customer/schedule"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
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
  );
}
