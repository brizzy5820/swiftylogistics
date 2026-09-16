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
          <p className="font-bold text-slate-900">{d.id}</p>
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
          <p className="truncate text-sm font-semibold text-slate-700">{d.pickup?.address}</p>
          <p className="truncate text-xs text-slate-500">→ {d.dropoff?.address}</p>
        </div>
      ),
    },
    { key: 'customer', label: 'Customer', accessor: 'customerName' },
    { key: 'package', label: 'Package', render: (d) => `${d.packageType} · ${d.weightKg}kg` },
    { key: 'price', label: 'Price', render: (d) => <span className="font-bold">₦{(d.price || 0).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (d) => <StatusPill status={d.status} /> },
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
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Deliveries</h1>
          <p className="mt-1 text-sm text-slate-500">All package deliveries. Click any row to view, advance status, or take action.</p>
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-2 py-2 text-xs font-bold transition sm:text-sm ${
                tab === t ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
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
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
            )}
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Details</p>
                  <DetailRow label="Status" value={STATUS_LABEL[selected.status]} />
                  <DetailRow label="Package" value={selected.packageType} />
                  <DetailRow label="Weight" value={`${selected.weightKg} kg`} />
                  <DetailRow label="Price" value={`₦${(selected.price || 0).toLocaleString()}`} />
                  <DetailRow label="Distance" value={`${selected.distanceKm} km`} />
                  <DetailRow label="Created" value={new Date(selected.createdAt).toLocaleString()} />
                  <div className="mt-3 flex items-center justify-between border-b border-slate-100 py-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tracking ID</span>
                    <CopyChip value={selected.trackingId} label="Tracking ID" />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Route</p>
                  <DetailRow label="Pickup" value={selected.pickup?.address} />
                  <DetailRow label="Dropoff" value={selected.dropoff?.address} />
                  {selected.note && <DetailRow label="Note" value={selected.note} />}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">People</p>
                  <DetailRow label="Customer" value={selected.customerName} />
                  <DetailRow label="Rider" value={selected.riderName || 'Unassigned'} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['accepted', 'picked_up', 'in_transit', 'delivered'].map((s) => (
                      <button
                        key={s}
                        onClick={() => advance(s)}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                          selected.status === s ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        → {STATUS_LABEL[s]}
                      </button>
                    ))}
                    <button onClick={() => advance('cancelled')} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-100">
                      → Cancelled
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </button>
                    <Link to={`/customer/track/${selected.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">
                      <MapPinned className="h-3.5 w-3.5" /> Live track
                    </Link>
                    <button onClick={remove} className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Timeline</p>
                  <div className="space-y-1.5 text-xs">
                    {selected.statusTimestamps ? Object.entries(selected.statusTimestamps).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5">
                        <span className="font-bold text-slate-700">{STATUS_LABEL[k] || k}</span>
                        <span className="text-slate-500">{new Date(v).toLocaleString()}</span>
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
