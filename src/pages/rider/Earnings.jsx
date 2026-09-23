import { useState } from 'react'
import { Wallet, Package, TrendingUp, Gift, Landmark, X, LoaderCircle, CheckCircle2, History } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useStore, useCurrentUser } from '@/lib/api-store'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { getWithdrawalCutoff, getWithdrawalHistory, recordWithdrawal } from '@/lib/mock-wallet'

export default function Earnings() {
  const user = useRequireAuth('rider')
  const { loading: userLoading } = useCurrentUser()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [historyVersion, setHistoryVersion] = useState(0)

  // Selecting the raw deliveries array (rather than a selector closed over
  // `user`) keeps this store-subscribed and always current — see the note
  // in rider/Dashboard.jsx for why closing a useStore selector over `user`
  // caused earnings to go stale until some unrelated store update.
  const deliveries = useStore((s) => s.deliveries)
  const completed = user ? deliveries.filter((d) => d.riderId === user.id && d.status === 'delivered') : []

  if (!user) return null

  const total = completed.reduce((a, d) => a + d.price, 0)
  const avg = completed.length ? Math.round(total / completed.length) : 0
  // Tips aren't fabricated — they only ever come from real per-order data
  // (d.tip), so this is honestly ₦0 until the backend actually sends tips.
  const totalTips = completed.reduce((a, d) => a + (d.tip || 0), 0)
  const avgTip = completed.length ? Math.round(totalTips / completed.length) : 0

  const cutoff = getWithdrawalCutoff(user.id)
  const withdrawableTrips = completed.filter((d) => {
    const completedAt = d.statusTimestamps?.delivered ? new Date(d.statusTimestamps.delivered).getTime() : d.createdAt
    return completedAt > cutoff
  })
  const availableBalance = withdrawableTrips.reduce((a, d) => a + d.price, 0)
  const history = getWithdrawalHistory(user.id)
  void historyVersion // re-render trigger after a withdrawal — see handleWithdraw

  // Show skeleton while user data is hydrating
  if (userLoading) {
    return (
      <AppShell>
        <main className="p-8 max-w-6xl mx-auto">
          <SkeletonCard className="mb-8" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SkeletonCard className="p-5" />
            <SkeletonCard className="p-5" />
            <SkeletonCard className="p-5" />
            <SkeletonCard className="p-5" />
          </div>
          <div className="mt-8 rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              <SkeletonCard className="h-12" />
              <SkeletonCard className="h-12" />
              <SkeletonCard className="h-12" />
              <SkeletonCard className="h-12" />
              <SkeletonCard className="h-12" />
            </div>
          </div>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <main className="p-8 max-w-6xl mx-auto">
        <PageHeader title="Earnings" subtitle="Your completed trips, payouts, and withdrawals." />

        <div className="rounded-2xl border border-emerald-900 bg-emerald-800 p-6 text-white shadow-lg sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">Available to withdraw</p>
            <p className="mt-1 font-display text-4xl font-bold">₦{availableBalance}</p>
            <p className="mt-2 text-xs text-emerald-300">
              {withdrawableTrips.length > 0
                ? `From ${withdrawableTrips.length} trip${withdrawableTrips.length === 1 ? '' : 's'} since your last withdrawal`
                : 'Complete a trip to start earning again'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            disabled={availableBalance <= 0}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto"
          >
            <Landmark className="h-4 w-4" /> Withdraw
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total earned" value={`₦${total}`} sub="all time" highlight Icon={Wallet} />
          <StatCard label="Deliveries" value={`${completed.length}`} sub="completed" Icon={Package} />
          <StatCard label="Avg per trip" value={`₦${avg}`} sub="payout" Icon={TrendingUp} />
          <StatCard label="Avg tip" value={`₦${avgTip}`} sub="per trip" Icon={Gift} />
        </div>

        <div className="mt-8 rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
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
        </div>

        {history.length > 0 && (
          <div className="mt-8 rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-surface-200 px-6 py-4">
              <History className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-900">Withdrawal history</h2>
            </div>
            <div className="divide-y divide-surface-200">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-6 py-3.5 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{entry.bankName} •••• {entry.accountLast4}</p>
                    <p className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="font-bold text-slate-900">₦{entry.amount}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {withdrawOpen && (
        <WithdrawModal
          user={user}
          availableBalance={availableBalance}
          onClose={() => setWithdrawOpen(false)}
          onSuccess={(amount, bankDetails) => {
            recordWithdrawal(user.id, { amount, ...bankDetails })
            setHistoryVersion((v) => v + 1)
            setWithdrawOpen(false)
            toast.success(`₦${amount} withdrawn to ${bankDetails.bankName} •••• ${String(bankDetails.accountNumber).slice(-4)}`)
          }}
        />
      )}
    </AppShell>
  )
}

function WithdrawModal({ user, availableBalance, onClose, onSuccess }) {
  const [bankName, setBankName] = useState(user.bankName || '')
  const [accountNumber, setAccountNumber] = useState(user.accountNumber || '')
  const [accountName, setAccountName] = useState(user.name || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    if (!bankName.trim() || accountNumber.trim().length < 6 || !accountName.trim()) {
      setError('Fill in your bank name, account number, and account name.')
      return
    }
    setError('')
    setSubmitting(true)
    // Mock only — simulate a short processing delay, no real transfer happens.
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setSubmitting(false)
    onSuccess(availableBalance, { bankName: bankName.trim(), accountNumber: accountNumber.trim(), accountName: accountName.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black text-slate-950">Withdraw earnings</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          ₦{availableBalance} will be sent to your bank account. This is a mock transfer for demo purposes — no real funds move.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Bank name</label>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. GTBank"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Account number</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="0123456789"
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Account name</label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Full name on account"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? (
              <><LoaderCircle className="h-4 w-4 animate-spin" /> Processing…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Withdraw ₦{availableBalance}</>
            )}
          </button>
        </form>
      </div>
    </div>
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
