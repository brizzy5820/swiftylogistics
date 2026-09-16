import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/lib/use-require-auth'
import { Wallet, Package, TrendingUp, LoaderCircle } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { useStore } from '@/lib/mock-store'
import { getDeliveries } from '@/services/api'

export default function Earnings() {
  const user = useRequireAuth('rider')
  const [loading, setLoading] = useState(true)
  const completed = useStore((s) =>
    user ? s.deliveries.filter((d) => d.riderId === user.id && d.status === 'delivered') : [],
  )
  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    setLoading(true)
    getDeliveries().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [user?.id])
  if (!user) return null

  const total = completed.reduce((a, d) => a + d.price, 0)
  const avg = completed.length ? Math.round(total / completed.length) : 0

  return (
    <AppShell>
      <main className="p-8 max-w-6xl mx-auto">
        <PageHeader title="Earnings" subtitle="Your completed deliveries and payouts." />

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading your earnings...
          </div>
        ) : <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total earned" value={`₦${total}`} sub="all time" highlight Icon={Wallet} />
          <StatCard label="Deliveries" value={`${completed.length}`} sub="completed" Icon={Package} />
          <StatCard label="Avg per trip" value={`₦${avg}`} sub="payout" Icon={TrendingUp} />
        </div>}

        {!loading && <div className="mt-8 rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-100 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 font-bold">Order</th>
                  <th className="hidden sm:table-cell text-left px-6 py-3 font-bold">Route</th>
                  <th className="hidden sm:table-cell text-left px-6 py-3 font-bold">Distance</th>
                  <th className="text-right px-4 sm:px-6 py-3 font-bold">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {completed.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 sm:px-6 py-4 font-bold">{d.id}</td>
                    <td className="hidden sm:table-cell px-6 py-4 text-slate-600 max-w-xs truncate">{d.pickup.address} → {d.dropoff.address}</td>
                    <td className="hidden sm:table-cell px-6 py-4 text-slate-600">{d.distanceKm} km</td>
                    <td className="px-4 sm:px-6 py-4 text-right font-bold text-emerald-600">+₦{d.price}</td>
                  </tr>
                ))}
                {completed.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      No completed deliveries yet. Accept a job to start earning.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>}
      </main>
    </AppShell>
  )
}

function StatCard({ label, value, sub, highlight, Icon }) {
  return (
    <div
      className={`rounded-2xl p-3 sm:p-5 shadow-sm border min-w-0 ${
        highlight ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-surface-200'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate ${
          highlight ? 'text-white/60' : 'text-slate-400'
        }`}>
          {label}
        </p>
        {Icon && <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${highlight ? 'text-white/40' : 'text-slate-300'}`} />}
      </div>
      <p className="mt-1 font-display text-lg sm:text-2xl font-bold truncate">{value}</p>
      <p className={`mt-1 text-[10px] sm:text-xs ${highlight ? 'text-white/60' : 'text-slate-400'}`}>{sub}</p>
    </div>
  )
}
