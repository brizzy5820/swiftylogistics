import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bike, Star, AlertTriangle, CheckCircle2, Trash2, Edit, KeyRound, CarFront, PackageCheck, Wallet, Plus } from 'lucide-react'
import { useRequireAdmin } from '../../lib/use-require-admin'
import { useStore, updateUser, deleteUser, createUser, adminSetPassword } from '../../lib/api-store'
import { AdminShell } from '../../components/admin/AdminShell'
import { DataTable, AdminModal, DetailRow, CopyChip } from '../../components/admin/DataTable'

function isProfileComplete(r) {
  return !!(r.vehicleType && r.plateNumber && r.licenseNumber && r.nin && r.bankName && r.accountNumber)
}

export default function AdminRiders() {
  useRequireAdmin()
  const users = useStore((s) => s.users)
  const deliveries = useStore((s) => s.deliveries)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [notice, setNotice] = useState('')
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', password: '', vehicleType: 'Bike', plateNumber: '', licenseNumber: '' })
  const [addError, setAddError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [newPwd, setNewPwd] = useState('')

  const riders = useMemo(() => users.filter((u) => u.role === 'rider'), [users])

  function openAdd() {
    setAddForm({ name: '', email: '', phone: '', password: '', vehicleType: 'Bike', plateNumber: '', licenseNumber: '' })
    setAddError('')
    setAdding(true)
  }
  async function submitAdd() {
    setAddError('')
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      setAddError('Name, email, and password are required.')
      return
    }
    try {
      const created = await createUser({ ...addForm, role: 'rider' })
      setAdding(false)
      setNotice(`Rider ${created.name} added.`)
    } catch (error) {
      setAddError(error.message || 'Unable to create rider.')
    }
  }

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Rider',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white shadow-xs">
            {r.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{r.name}</p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicleType || '—' },
    { key: 'plate', label: 'Plate', hideOnMobile: true, render: (r) => r.plateNumber || '—' },
    {
      key: 'uid',
      label: 'UID',
      hideOnMobile: true,
      render: (r) => <CopyChip value={r.uid} label="UID" />,
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (r) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
          <Star className="h-3 w-3" /> {r.rating ?? 5}
        </span>
      ),
    },
    {
      key: 'jobs',
      label: 'Jobs',
      hideOnMobile: true,
      render: (r) => deliveries.filter((d) => d.riderId === r.id).length,
    },
    {
      key: 'status',
      label: 'Profile',
      render: (r) => {
        const ok = isProfileComplete(r)
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ok ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'}`}>
            {ok ? <><CheckCircle2 className="h-3 w-3" /> Verified</> : <><AlertTriangle className="h-3 w-3" /> Incomplete</>}
          </span>
        )
      },
    },
  ], [deliveries])

  function open(r) {
    setSelected(r)
    setEditing(false)
    setEditName(r?.name || '')
    setEditPhone(r?.phone || '')
    setNotice('')
  }

  function close() {
    setSelected(null)
    setEditing(false)
    setShowPwd(false)
    setNewPwd('')
  }

  async function saveEdit() {
    if (!selected) return
    try {
      await updateUser(selected.id, { name: editName.trim() || selected.name, phone: editPhone.trim() })
      setNotice('Rider profile saved.')
      setEditing(false)
    } catch (error) {
      setNotice(error.message || 'Unable to update rider.')
    }
  }

  async function resetPwd() {
    if (!selected) return
    setShowPwd(true)
    setNotice('Enter a new password to update this account.')
  }

  async function setPassword() {
    if (!selected) return
    if (!newPwd.trim()) {
      setNotice('Enter a new password first.')
      return
    }
    try {
      await adminSetPassword(selected.id, newPwd.trim())
      setNotice(`Password updated for ${selected.email}.`)
      setNewPwd('')
      setShowPwd(false)
    } catch (error) {
      setNotice(error.message || 'Unable to update password.')
    }
  }

  async function remove() {
    if (!selected) return
    if (!confirm(`Delete rider ${selected.name}? Their jobs will also be removed.`)) return
    try { await deleteUser(selected.id); close() } catch (error) { setNotice(error.message || 'Unable to delete user.') }
  }

  function verify() {
    if (!selected) return
    updateUser(selected.id, { isActive: true })
    setNotice('Rider account activated.')
  }

  const riderJobs = selected ? deliveries.filter((d) => d.riderId === selected.id).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : []

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Riders</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fleet overview, verification status, and per-rider actions.</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-500 w-full sm:w-auto shrink-0"
          >
            <Plus className="h-4 w-4" /> Add rider
          </button>
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">{notice}</div>
        )}

        <DataTable
          columns={columns}
          rows={riders}
          onRowClick={open}
          emptyState={<><Bike className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />No riders found.</>}
        />
      </div>

      <AdminModal open={!!selected} onClose={close} title={selected?.name || 'Rider'} subtitle={selected?.email} width="max-w-3xl">
        {selected && (
          <div className="space-y-5">
            {notice && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">{notice}</div>
            )}
            <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Profile</p>
                {editing ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</span>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phone</span>
                      <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
                    </label>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Save</button>
                      <button onClick={() => { setEditing(false); setEditName(selected.name); setEditPhone(selected.phone || '') }} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <DetailRow label="Name" value={selected.name} />
                    <DetailRow label="Email" value={selected.email} mono />
                    <DetailRow label="Phone" value={selected.phone || '—'} />
                    <DetailRow label="Vehicle" value={selected.vehicleType} />
                    <DetailRow label="Plate" value={selected.plateNumber} />
                    <DetailRow label="License" value={selected.licenseNumber} />
                    <DetailRow label="NIN" value={selected.nin} mono />
                    <DetailRow label="Bank" value={selected.bankName} />
                    <DetailRow label="Account" value={selected.accountNumber} mono />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
                      {!isProfileComplete(selected) && (
                        <button onClick={verify} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/25">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                        </button>
                      )}
                      <button onClick={resetPwd} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/25">
                        <KeyRound className="h-3.5 w-3.5" /> Reset password
                      </button>
                      <button onClick={() => setShowPwd((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 dark:border-slate-600 bg-slate-900 dark:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800">
                        <KeyRound className="h-3.5 w-3.5" /> {showPwd ? 'Cancel set' : 'Set password'}
                      </button>
                      <button onClick={remove} className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/25">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>

                    {showPwd && (
                      <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Set a new password for {selected.email}</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            placeholder="New password"
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                          />
                          <button onClick={setPassword} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500">
                            Save
                          </button>
                        </div>
                        <p className="mt-1.5 text-[10px] text-slate-400">The new password takes effect on the very next login attempt.</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Jobs & earnings</p>
                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 p-2.5 sm:p-3 text-center">
                    <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">{riderJobs.length}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-300">Total</p>
                  </div>
                  <div className="rounded-xl bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 p-2.5 sm:p-3 text-center">
                    <p className="text-base sm:text-lg font-black text-sky-700 dark:text-sky-400">{riderJobs.filter((d) => !['delivered', 'cancelled'].includes(d.status)).length}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase text-sky-600 dark:text-sky-300">Active</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 p-2.5 sm:p-3 text-center">
                    <p className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-400 truncate">₦{riderJobs.filter((d) => d.status === 'delivered').reduce((s, d) => s + (d.price || 0), 0).toLocaleString()}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase text-amber-600 dark:text-amber-300">Earned</p>
                  </div>
                </div>
                {riderJobs.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-6 text-center text-sm text-slate-500 dark:text-slate-400">No jobs assigned yet.</div>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {riderJobs.slice(0, 8).map((d) => (
                      <Link key={d.id} to={`/customer/track/${d.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3 transition hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:hover:bg-slate-800">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {d.type === 'ride' ? <CarFront className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{d.id}</p>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{d.customerName}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 shrink-0">{d.status?.replaceAll('_', ' ')}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add rider"
        subtitle="Onboard a new rider to the fleet."
        width="max-w-lg"
      >
        <div className="space-y-3">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full name</span>
              <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phone</span>
              <input value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</span>
              <input type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</span>
              <input type="text" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vehicle type</span>
              <select value={addForm.vehicleType} onChange={(e) => setAddForm((f) => ({ ...f, vehicleType: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500">
                {['Bike', 'Car', 'Van'].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Plate number</span>
              <input value={addForm.plateNumber} onChange={(e) => setAddForm((f) => ({ ...f, plateNumber: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
          </div>
          {addError && <p className="rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-3 py-2 text-center text-xs text-rose-600 dark:text-rose-400">{addError}</p>}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
            <button onClick={submitAdd} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500">
              Add rider
            </button>
            <button onClick={() => setAdding(false)} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
              Cancel
            </button>
          </div>
        </div>
      </AdminModal>
    </AdminShell>
  )
}
