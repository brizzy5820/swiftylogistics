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
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
            {r.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{r.name}</p>
            <p className="truncate text-xs text-slate-500">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicleType || '—' },
    { key: 'plate', label: 'Plate', render: (r) => r.plateNumber || '—' },
    {
      key: 'uid',
      label: 'UID',
      render: (r) => <CopyChip value={r.uid} label="UID" />,
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (r) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
          <Star className="h-3 w-3" /> {r.rating ?? 5}
        </span>
      ),
    },
    {
      key: 'jobs',
      label: 'Jobs',
      render: (r) => deliveries.filter((d) => d.riderId === r.id).length,
    },
    {
      key: 'status',
      label: 'Profile',
      render: (r) => {
        const ok = isProfileComplete(r)
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
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
  function close() { setSelected(null); setEditing(false); setNotice('') }

  async function saveEdit() {
    if (!selected) return
    try {
      await updateUser(selected.id, { name: editName.trim() || selected.name, phone: editPhone.trim() })
    } catch (error) { setNotice(error.message || 'Unable to update user.'); return }
    setNotice('Rider updated.')
    setEditing(false)
  }

  function resetPwd() {
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Riders</h1>
            <p className="mt-1 text-sm text-slate-500">Fleet overview, verification status, and per-rider actions.</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" /> Add rider
          </button>
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
        )}

        <DataTable
          columns={columns}
          rows={riders}
          onRowClick={open}
          emptyState={<><Bike className="mx-auto mb-2 h-8 w-8 text-slate-300" />No riders yet.</>}
        />
      </div>

      <AdminModal open={!!selected} onClose={close} title={selected?.name || 'Rider'} subtitle={selected?.email} width="max-w-3xl">
        {selected && (
          <div className="space-y-5">
            {notice && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
            )}
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Profile</p>
                {editing ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</span>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</span>
                      <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
                    </label>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Save</button>
                      <button onClick={() => { setEditing(false); setEditName(selected.name); setEditPhone(selected.phone || '') }} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
                      {!isProfileComplete(selected) && (
                        <button onClick={verify} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                        </button>
                      )}
                      <button onClick={resetPwd} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100">
                        <KeyRound className="h-3.5 w-3.5" /> Reset to default
                      </button>
                      <button onClick={() => setShowPwd((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-900  px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700">
                        <KeyRound className="h-3.5 w-3.5" /> {showPwd ? 'Cancel set' : 'Set password'}
                      </button>
                      <button onClick={remove} className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>

                    {showPwd && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Set a new password for {selected.email}</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            placeholder="New password"
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
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
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Jobs & earnings</p>
                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-lg font-black text-emerald-700">{riderJobs.length}</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600">Total</p>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-3 text-center">
                    <p className="text-lg font-black text-sky-700">{riderJobs.filter((d) => !['delivered', 'cancelled'].includes(d.status)).length}</p>
                    <p className="text-[10px] font-bold uppercase text-sky-600">Active</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-center">
                    <p className="text-lg font-black text-amber-700">₦{riderJobs.filter((d) => d.status === 'delivered').reduce((s, d) => s + (d.price || 0), 0).toLocaleString()}</p>
                    <p className="text-[10px] font-bold uppercase text-amber-600">Earned</p>
                  </div>
                </div>
                {riderJobs.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No jobs assigned yet.</div>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {riderJobs.slice(0, 8).map((d) => (
                      <Link key={d.id} to={`/customer/track/${d.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          {d.type === 'ride' ? <CarFront className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">{d.id}</p>
                          <p className="truncate text-xs text-slate-500">{d.customerName}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">{d.status?.replaceAll('_', ' ')}</span>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Full name</span>
              <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Phone</span>
              <input value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Email</span>
              <input type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Password</span>
              <input type="text" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle type</span>
              <select value={addForm.vehicleType} onChange={(e) => setAddForm((f) => ({ ...f, vehicleType: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500">
                {['Bike', 'Car', 'Van'].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Plate number</span>
              <input value={addForm.plateNumber} onChange={(e) => setAddForm((f) => ({ ...f, plateNumber: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
          </div>
          {addError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-center text-xs text-rose-600">{addError}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={submitAdd} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500">
              Add rider
            </button>
            <button onClick={() => setAdding(false)} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </AdminModal>
    </AdminShell>
  )
}
