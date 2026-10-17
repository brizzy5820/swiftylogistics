import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Bike, CarFront, PackageCheck, LifeBuoy, TrendingUp, Wallet, Activity, AlertTriangle, ChevronRight } from 'lucide-react'
import { useRequireAdmin } from '../../lib/use-require-admin'
import { useStore, STATUS_LABEL } from '../../lib/api-store'
import { AdminShell } from '../../components/admin/AdminShell'
import { DataTable, AdminModal, DetailRow, StatusPill } from '../../components/admin/DataTable'

export default function AdminDashboard() {
  useRequireAdmin()
  const users = useStore((s) => s.users)
  const deliveries = useStore((s) => s.deliveries)
  const tickets = useStore((s) => s.supportTickets ?? [])
  const [selectedDelivery, setSelectedDelivery] = useState(null)

  const customers = useMemo(() => users.filter((u) => u.role === 'customer'), [users])
  const riders = useMemo(() => users.filter((u) => u.role === 'rider'), [users])
  const rides = useMemo(() => deliveries.filter((d) => d.type === 'ride'), [deliveries])
  const parcelDeliveries = useMemo(() => deliveries.filter((d) => d.type !== 'ride'), [deliveries])
  const activeTrips = useMemo(
    () => deliveries.filter((d) => !['delivered', 'cancelled'].includes(d.status)).length,
    [deliveries],
  )
  const openTickets = useMemo(() => tickets.filter((t) => t.status === 'open').length, [tickets])
  const totalRevenue = useMemo(
    () => deliveries.filter((d) => d.status === 'delivered').reduce((s, d) => s + (d.price || 0), 0),
    [deliveries],
  )

  const recentDeliveries = useMemo(
    () => [...deliveries].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8),
    [deliveries],
  )

  const metrics = [
    { label: 'Customers', value: customers.length, Icon: Users, tone: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15', to: '/admin/customers' },
    { label: 'Riders', value: riders.length, Icon: Bike, tone: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/15', to: '/admin/riders' },
    { label: 'Rides', value: rides.length, Icon: CarFront, tone: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/15', to: '/admin/rides' },
    { label: 'Deliveries', value: parcelDeliveries.length, Icon: PackageCheck, tone: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/15', to: '/admin/deliveries' },
    { label: 'Active trips', value: activeTrips, Icon: Activity, tone: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/15' },
    { label: 'Open tickets', value: openTickets, Icon: LifeBuoy, tone: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/15', to: '/admin/support' },
    { label: 'Revenue', value: `₦${totalRevenue.toLocaleString()}`, Icon: Wallet, tone: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15' },
    { label: 'Total users', value: users.length, Icon: TrendingUp, tone: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
  ]

  const recentColumns = [
    {
      key: 'type',
      label: '',
      className: 'w-10',
      render: (d) => (
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${d.type === 'ride' ? 'bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300' : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>
          {d.type === 'ride' ? <CarFront className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
        </span>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (d) => (
        <div className="min-w-0">
          <p className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{d.pickup?.address} → {d.dropoff?.address}</p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{d.id} · {d.customerName}</p>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      hideOnMobile: true,
      render: (d) => <span className="font-bold text-slate-900 dark:text-white">₦{(d.price || 0).toLocaleString()}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      align: 'right',
      render: (d) => <StatusPill status={d.status} />,
    },
  ]

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Operations overview</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live picture of customers, riders, trips, and support across the platform.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => {
            const hasLink = Boolean(m.to)
            const Component = hasLink ? Link : 'div'

            return (
              <Component
                key={m.label}
                to={m.to}
                className={`group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-all duration-150 ${
                  hasLink
                    ? 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                    : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                      {m.label}
                    </span>
                    <span className={`inline-flex items-center justify-center rounded-lg p-2 ${m.bg || 'bg-slate-100 dark:bg-slate-800'}`}>
                      <m.Icon className={`h-4 w-4 ${m.tone || 'text-slate-600 dark:text-slate-300'}`} />
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {m.value}
                    </span>
                  </div>
                </div>

                {hasLink && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-colors group-hover:underline">
                      View details
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </div>
                )}
              </Component>
            )
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">Recent activity</h2>
            <Link to="/admin/deliveries" className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">View all</Link>
          </div>
          <DataTable
            columns={recentColumns}
            rows={recentDeliveries}
            onRowClick={setSelectedDelivery}
            onSearch={false}
            emptyState="No activity yet. Once customers book, it shows here."
          />
        </div>
      </div>

      <AdminModal open={!!selectedDelivery} onClose={() => setSelectedDelivery(null)} title={selectedDelivery ? `${selectedDelivery.id}` : ''} subtitle={selectedDelivery?.trackingId} width="max-w-3xl">
        {selectedDelivery && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Details</p>
              <DetailRow label="Status" value={STATUS_LABEL[selectedDelivery.status]} />
              <DetailRow label="Type" value={selectedDelivery.type === 'ride' ? selectedDelivery.rideType : selectedDelivery.packageType} />
              <DetailRow label="Price" value={`₦${(selectedDelivery.price || 0).toLocaleString()}`} />
              <DetailRow label="Customer" value={selectedDelivery.customerName} />
              <DetailRow label="Pickup" value={selectedDelivery.pickup?.address} />
              <DetailRow label="Dropoff" value={selectedDelivery.dropoff?.address} />
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <Link to={`/customer/track/${selectedDelivery.id}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 w-full sm:w-auto">
                Open live track
              </Link>
              <Link to={selectedDelivery.type === 'ride' ? '/admin/rides' : '/admin/deliveries'} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 w-full sm:w-auto">
                Manage in {selectedDelivery.type === 'ride' ? 'Rides' : 'Deliveries'}
              </Link>
            </div>
          </div>
        )}
      </AdminModal>
    </AdminShell>
  )
}
