import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Bike, CarFront, PackageCheck, LifeBuoy, TrendingUp, Wallet, Activity, AlertTriangle, ChevronRight } from 'lucide-react'
import { useRequireAdmin } from '../../lib/use-require-admin'
import { useStore, STATUS_LABEL } from '../../lib/mock-store'
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
    { label: 'Customers', value: customers.length, Icon: Users, tone: 'text-emerald-700', bg: 'bg-emerald-50', to: '/admin/customers' },
    { label: 'Riders', value: riders.length, Icon: Bike, tone: 'text-sky-700', bg: 'bg-sky-50', to: '/admin/riders' },
    { label: 'Rides', value: rides.length, Icon: CarFront, tone: 'text-violet-700', bg: 'bg-violet-50', to: '/admin/rides' },
    { label: 'Deliveries', value: parcelDeliveries.length, Icon: PackageCheck, tone: 'text-amber-700', bg: 'bg-amber-50', to: '/admin/deliveries' },
    { label: 'Active trips', value: activeTrips, Icon: Activity, tone: 'text-rose-700', bg: 'bg-rose-50' },
    { label: 'Open tickets', value: openTickets, Icon: LifeBuoy, tone: 'text-orange-700', bg: 'bg-orange-50', to: '/admin/support' },
    { label: 'Revenue', value: `₦${totalRevenue.toLocaleString()}`, Icon: Wallet, tone: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Total users', value: users.length, Icon: TrendingUp, tone: 'text-slate-700', bg: 'bg-slate-100' },
  ]

  const recentColumns = [
    {
      key: 'type',
      label: '',
      render: (d) => (
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${d.type === 'ride' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'}`}>
          {d.type === 'ride' ? <CarFront className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
        </span>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (d) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{d.pickup?.address} → {d.dropoff?.address}</p>
          <p className="truncate text-xs text-slate-500">{d.id} · {d.customerName}</p>
        </div>
      ),
    },
    { key: 'price', label: 'Price', render: (d) => <span className="font-bold">₦{(d.price || 0).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (d) => <StatusPill status={d.status} /> },
  ]

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Operations overview</h1>
          <p className="mt-1 text-sm text-slate-500">Live picture of customers, riders, trips, and support across the platform.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => {
        const hasLink = Boolean(m.to)
        const Component = hasLink ? Link : 'div'

        return (
          <Component
            key={m.label}
            to={m.to}
            className={`group relative flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition-all duration-150 ${
              hasLink
                ? 'hover:border-slate-300 hover:shadow-md'
                : ''
            }`}
          >
            {/* Header: Label & Icon */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500 truncate">
                  {m.label}
                </span>
                <span className={`inline-flex items-center justify-center rounded-md p-2 text-slate-600 ${m.bg || 'bg-slate-100'}`}>
                  <m.Icon className="h-4 w-4 text-slate-600" />
                </span>
              </div>

              {/* Value & Subtitle/Trend */}
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-semibold tracking-tight text-slate-900">
                  {m.value}
                </span>

                {m.trend && (
                  <span
                    className={`inline-flex items-center text-xs font-medium ${
                      m.trendType === 'down' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {m.trend}
                  </span>
                )}
              </div>
            </div>

            {/* Footer / Action link */}
            {hasLink && (
              <div className=" flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="text-xs font-medium text-blue-600 transition-colors group-hover:text-blue-700">
                  View details
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-blue-600" />
              </div>
            )}
          </Component>
        )
      })}
    </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-950">Recent activity</h2>
            <Link to="/admin/deliveries" className="text-sm font-bold text-emerald-700 hover:underline">View all</Link>
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Details</p>
              <DetailRow label="Status" value={STATUS_LABEL[selectedDelivery.status]} />
              <DetailRow label="Type" value={selectedDelivery.type === 'ride' ? selectedDelivery.rideType : selectedDelivery.packageType} />
              <DetailRow label="Price" value={`₦${(selectedDelivery.price || 0).toLocaleString()}`} />
              <DetailRow label="Customer" value={selectedDelivery.customerName} />
              <DetailRow label="Pickup" value={selectedDelivery.pickup?.address} />
              <DetailRow label="Dropoff" value={selectedDelivery.dropoff?.address} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/customer/track/${selectedDelivery.id}`} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">
                Open live track
              </Link>
              <Link to={selectedDelivery.type === 'ride' ? '/admin/rides' : '/admin/deliveries'} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Manage in {selectedDelivery.type === 'ride' ? 'Rides' : 'Deliveries'}
              </Link>
            </div>
          </div>
        )}
      </AdminModal>
    </AdminShell>
  )
}
