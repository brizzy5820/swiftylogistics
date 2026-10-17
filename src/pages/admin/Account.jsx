import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, User as UserIcon, Lock, CheckCircle2, Save, Shield, RotateCcw } from 'lucide-react'
import { useRequireAdmin } from '../../lib/use-require-admin'
import { useStore, signOut, updateCurrentUser, adminSetPassword } from '../../lib/api-store'
import { AdminShell } from '../../components/admin/AdminShell'
import { DetailRow } from '../../components/admin/DataTable'

export default function AdminAccount() {
  const navigate = useNavigate()
  const user = useRequireAdmin()
  const liveUser = useStore((s) => s.session ? s.users.find((u) => u.id === s.session.userId) : null)
  const account = liveUser || user
  const [name, setName] = useState(account?.name || '')
  const [newPassword, setNewPassword] = useState('')
  const [saved, setSaved] = useState('')

  async function save() {
    try {
      await updateCurrentUser({ name: name.trim() || account.name })
      if (newPassword) await adminSetPassword(account.id || account._id, newPassword)
      setNewPassword('')
      setSaved('Account updated.')
    } catch (error) {
      setSaved(error.message || 'Unable to update account.')
    }
    setTimeout(() => setSaved(''), 2500)
  }

  function logout() {
    signOut()
    navigate('/auth?mode=admin')
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Admin account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your profile, credentials, and platform controls.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-xs shrink-0">
                {account?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{account?.name || 'Administrator'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{account?.email || 'admin@swifty.app'}</p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <Shield className="h-3 w-3" /> Administrator
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <UserIcon className="h-3 w-3" /> Full name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Lock className="h-3 w-3" /> New password
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            {saved && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> <span>{saved}</span>
              </div>
            )}

            <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-3">
              <button onClick={save} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 w-full sm:w-auto">
                <Save className="h-4 w-4" /> Save changes
              </button>
              <button onClick={logout} className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-500/10 px-5 py-2.5 text-sm font-bold text-rose-600 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-500/20 w-full sm:w-auto">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Account details</p>
              <div className="mt-4 space-y-3 text-sm">
                <DetailRow label="Email" value={account?.email} />
                <DetailRow label="Role" value="Administrator" />
                <DetailRow label="Department" value={account?.department || 'Operations'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
