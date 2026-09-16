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
    navigate('/auth')
  }


  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Admin account</h1>
          <p className="mt-1 text-sm text-slate-500">Your profile, credentials, and platform controls.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white">
                {account?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{account?.name}</p>
                <p className="text-xs text-slate-500">{account?.email}</p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <Shield className="h-3 w-3" /> Administrator
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <UserIcon className="h-3 w-3" /> Full name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Lock className="h-3 w-3" /> New password
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            {saved && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> {saved}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={save} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500">
                <Save className="h-4 w-4" /> Save changes
              </button>
              <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-900">Account details</p>
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
