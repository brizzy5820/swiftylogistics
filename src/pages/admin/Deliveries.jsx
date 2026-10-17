import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageCheck, Trash2, RotateCcw, MapPinned, Edit } from 'lucide-react'
import { useRequireAdmin } from '../../lib/use-require-admin'
import { useStore, updateDeliveryStatus, deleteDelivery, adminResetDelivery, STATUS_LABEL } from '../../lib/api-store'
import { AdminShell } from '../../components/admin/AdminShell'
import { DataTable, AdminModal, DetailRow, StatusPill, CopyChip } from '../../components/admin/DataTable'

const TABS = ['All', 'Active', 'Delivered', 'Cancelled']

export default function AdminDeliveries() {
  useRequireAdmin()
  const deliveries = useStore((s) => s.deliveries)
  const [tab, setTab] = useState('All')
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')

  const items = useMemo(
    () => deliveries
      .filter((d) => d.type !== 'ride')
      .filter((d) => {
        if (tab === 'Active') return !['delivered', 'cancelled'].includes(d.status)
        if (tab === 'Delivered') return d.status === 'delivered'
        if (tab === 'Cancelled') return d.status === 'cancelled'
        return true
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [deliveries, tab],
  )

  const columns = [
    {
      key: 'id',
      label: 'Delivery',
      render: (d) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{d.id}</p>
          <div className="mt-1">
            <CopyChip value={d.trackingId} label="Tracking ID" />
          </div>
        </div>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (d) => (
        <div className="min-w-0">
          <p className="truncate text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">{d.pickup?.address}</p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">→ {d.dropoff?.address}</p>
        </div>
      ),
    },
    { key: 'customer', label: 'Customer', hideOnMobile: true, accessor: 'customerName' },
    { key: 'package', label: 'Package', hideOnMobile: true, render: (d) => `${d.packageType} · ${d.weightKg}kg` },
    { key: 'price', label: 'Price', render: (d) => <span className="font-bold text-slate-900 dark:text-white">₦{(d.price || 0).toLocaleString()}</span> },
    { key: 'status', label: 'Status', align: 'right', render: (d) => <StatusPill status={d.status} /> },
  ]

  function open(d) { setSelected(d); setNotice('') }
  function close() { setSelected(null); setNotice('') }

  function advance(s) {
    if (!selected) return
    updateDeliveryStatus(selected.id, s)
    setNotice(`Status set to ${STATUS_LABEL[s]}.`)
  }

  function reset() {
    if (!selected) return
    adminResetDelivery(selected.id)
    setNotice('Delivery reset to pending.')
  }

  function remove() {
    if (!selected) return
    if (!confirm(`Delete delivery ${selected.id}?`)) return
    deleteDelivery(selected.id)
    close()
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Deliveries</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All package deliveries. Click any row to view, advance status, or take action.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 sm:p-1.5 shadow-xs">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg sm:rounded-xl px-2 py-2 text-xs font-bold transition sm:text-sm text-center ${
                tab === t
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <DataTable columns={columns} rows={items} onRowClick={open} emptyState={<>No deliveries match the current filter.</>} />
      </div>

      <AdminModal open={!!selected} onClose={close} title={selected ? `Delivery ${selected.id}` : ''} subtitle={selected?.trackingId} width="max-w-3xl">
        {selected && (
          <div className="space-y-5">
            {notice && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">{notice}</div>
            )}
            <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Details</p>
                  <DetailRow label="Status" value={STATUS_LABEL[selected.status]} />
                  <DetailRow label="Package" value={selected.packageType} />
                  <DetailRow label="Weight" value={`${selected.weightKg} kg`} />
                  <DetailRow label="Price" value={`₦${(selected.price || 0).toLocaleString()}`} />
                  <DetailRow label="Distance" value={`${selected.distanceKm} km`} />
                  <DetailRow label="Created" value={new Date(selected.createdAt).toLocaleString()} />
                  <div className="mt-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 py-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tracking ID</span>
                    <CopyChip value={selected.trackingId} label="Tracking ID" />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Route</p>
                  <DetailRow label="Pickup" value={selected.pickup?.address} />
                  <DetailRow label="Dropoff" value={selected.dropoff?.address} />
                  {selected.note && <DetailRow label="Note" value={selected.note} />}
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">People</p>
                  <DetailRow label="Customer" value={selected.customerName} />
                  <DetailRow label="Rider" value={selected.riderName || 'Unassigned'} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['accepted', 'picked_up', 'in_transit', 'delivered'].map((s) => (
                      <button
                        key={s}
                        onClick={() => advance(s)}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                          selected.status === s ? 'border-emerald-300 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        → {STATUS_LABEL[s]}
                      </button>
                    ))}
                    <button onClick={() => advance('cancelled')} className="rounded-xl border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/15 px-3 py-2 text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/25">
                      → Cancelled
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </button>
                    <Link to={`/customer/track/${selected.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">
                      <MapPinned className="h-3.5 w-3.5" /> Live track
                    </Link>
                    <button onClick={remove} className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/25">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Timeline</p>
                  <div className="space-y-1.5 text-xs">
                    {selected.statusTimestamps ? Object.entries(selected.statusTimestamps).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{STATUS_LABEL[k] || k}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">{new Date(v).toLocaleString()}</span>
                      </div>
                    )) : <p className="text-slate-400">No events yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </AdminShell>
  )
}
