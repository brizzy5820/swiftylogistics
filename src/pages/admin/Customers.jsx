import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, CarFront, PackageCheck, Trash2, Edit, KeyRound, Plus } from 'lucide-react'
import { useRequireAdmin } from '../../lib/use-require-admin'
import { useStore, updateUser, deleteUser, forgotPassword, createUser, adminSetPassword } from '../../lib/mock-store'
import { AdminShell } from '../../components/admin/AdminShell'
import { DataTable, AdminModal, DetailRow, CopyChip } from '../../components/admin/DataTable'

export default function AdminCustomers() {
  useRequireAdmin()
  const users = useStore((s) => s.users)
  const deliveries = useStore((s) => s.deliveries)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [notice, setNotice] = useState('')
  const [adding, setAdding] = useState(false)
  const [addRole, setAddRole] = useState('customer')
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [addError, setAddError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [newPwd, setNewPwd] = useState('')

  const customers = useMemo(() => users.filter((u) => u.role === 'customer'), [users])

  function openAdd() {
    setAddForm({ name: '', email: '', phone: '', password: '' })
    setAddRole('customer')
    setAddError('')
    setAdding(true)
  }
  function submitAdd() {
    setAddError('')
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      setAddError('Name, email, and password are required.')
      return
    }
    const created = createUser({ ...addForm, role: addRole })
    if (!created) {
      setAddError('An account with that email already exists.')
      return
    }
    setAdding(false)
    setNotice(`Created ${created.name} (${addRole}).`)
  }

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            {c.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{c.name}</p>
            <p className="truncate text-xs text-slate-500">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'uid',
      label: 'UID',
      render: (c) => <CopyChip value={c.uid} label="UID" />,
    },
    { key: 'phone', label: 'Phone', accessor: 'phone' },
    {
      key: 'trips',
      label: 'Activity',
      render: (c) => {
        const userDeliveries = deliveries.filter((d) => d.customerId === c.id)
        const rides = userDeliveries.filter((d) => d.type === 'ride').length
        const packages = userDeliveries.length - rides
        return (
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-bold text-violet-700">
              <CarFront className="h-3 w-3" /> {rides}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
              <PackageCheck className="h-3 w-3" /> {packages}
            </span>
          </div>
        )
      },
    },
    { key: 'joined', label: 'Joined', accessor: (c) => new Date(c.createdAt || Date.now()).toLocaleDateString() },
  ], [deliveries])

  function open(c) {
    setSelected(c)
    setEditing(false)
    setEditName(c?.name || '')
    setEditPhone(c?.phone || '')
    setNotice('')
  }

  function close() {
    setSelected(null)
    setEditing(false)
    setNotice('')
  }

  function saveEdit() {
    if (!selected) return
    updateUser(selected.id, { name: editName.trim() || selected.name, phone: editPhone.trim() })
    setNotice('Customer updated.')
    setEditing(false)
  }

  function resetPwd() {
    if (!selected) return
    forgotPassword(selected.email)
    setNotice(`Password reset to reset1234. ${selected.email} can log in now.`)
  }

  function setPassword() {
    if (!selected) return
    if (!newPwd.trim()) {
      setNotice('Enter a new password first.')
      return
    }
    const updated = adminSetPassword(selected.id, newPwd.trim())
    if (updated) {
      setNotice(`Password updated for ${selected.email}. They can log in with the new password right away.`)
      setNewPwd('')
      setShowPwd(false)
    }
  }

  function remove() {
    if (!selected) return
    if (!confirm(`Delete ${selected.name}? Their bookings will also be removed.`)) return
    deleteUser(selected.id)
    close()
  }

  const selectedDeliveries = selected
    ? deliveries.filter((d) => d.customerId === selected.id).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    : []

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Customers</h1>
            <p className="mt-1 text-sm text-slate-500">Manage everyone who has signed up. Click any row to edit, reset password, or delete.</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" /> Add user
          </button>
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
        )}

        <DataTable
          columns={columns}
          rows={customers}
          onRowClick={open}
          emptyState={<><Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />No customers yet.</>}
        />
      </div>

      <AdminModal
        open={!!selected}
        onClose={close}
        title={selected?.name || 'Customer'}
        subtitle={selected?.email}
        width="max-w-3xl"
      >
        {selected && (
          <div className="space-y-5">
            {notice && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {notice}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Profile</p>
                {editing ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</span>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</span>
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500">
                        Save
                      </button>
                      <button onClick={() => { setEditing(false); setEditName(selected.name); setEditPhone(selected.phone || '') }} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <DetailRow label="Name" value={selected.name} />
                    <DetailRow label="Email" value={selected.email} mono />
                    <DetailRow label="Phone" value={selected.phone || '—'} />
                    <DetailRow label="Role" value="Customer" />
                    <DetailRow label="Total orders" value={selectedDeliveries.length} />
                    <DetailRow label="Active" value={selectedDeliveries.filter((d) => !['delivered', 'cancelled'].includes(d.status)).length} />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
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
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Recent orders</p>
                {selectedDeliveries.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No bookings yet.
                  </div>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {selectedDeliveries.slice(0, 8).map((d) => (
                      <Link
                        key={d.id}
                        to={`/customer/track/${d.id}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          {d.type === 'ride' ? <CarFront className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">{d.id}</p>
                          <p className="truncate text-xs text-slate-500">{d.pickup?.address} → {d.dropoff?.address}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          {d.status?.replaceAll('_', ' ')}
                        </span>
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
        title="Add user"
        subtitle="Create a new account from the operations console."
        width="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Role</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'customer', label: 'Customer' },
                { id: 'rider', label: 'Rider' },
                { id: 'admin', label: 'Admin' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setAddRole(r.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                    addRole === r.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
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
              <input type="text" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="Set initial password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            </label>
          </div>
          {addError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-center text-xs text-rose-600">{addError}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={submitAdd} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500">
              Create {addRole}
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
