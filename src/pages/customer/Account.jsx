import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  User,
  LogOut,
  Settings,
  Shield,
  Mail,
  ArrowLeft,
  BarChart3,
  Bell,
  Camera,
  Check,
  ChevronRight,
  LifeBuoy,
  History,
  PhoneCall,
  Package,
  Clock,
  Pencil,
  Save,
  Lock,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { BottomSheet } from '@/components/bottom-sheet'
import { PageHeader } from '@/components/page-header'
import { useRequireAuth } from '@/lib/use-require-auth'
import { signOut, useStore, STATUS_LABEL } from '@/lib/mock-store'
import { updateMe, logout as apiLogout } from '@/services/api'
import { readImageAsDataUrl } from '@/lib/image'

const SECTIONS = [
  { id: 'profile', label: 'Profile', description: 'Personal details and activity', Icon: User },
  { id: 'settings', label: 'Settings', description: 'Security and notification preferences', Icon: Settings },
  { id: 'help', label: 'Help', description: 'Support and contact options', Icon: LifeBuoy },
  { id: 'history', label: 'History', description: 'Recent shipments and records', Icon: History },
]

export default function Account() {
  const user = useRequireAuth('customer')
  const navigate = useNavigate()
  const location = useLocation()
  const liveUser = useStore((s) => (s.session ? s.users.find((item) => item.id === s.session.userId) : null))
  const accountUser = liveUser ?? user
  const [activeSection, setActiveSection] = useState(null)
  const [activeModal, setActiveModal] = useState(null)
  const [password, setPassword] = useState('')
  const [preferences, setPreferences] = useState({ email: true, sms: true, marketing: false })
  const [savedNotice, setSavedNotice] = useState('')
  const [avatarError, setAvatarError] = useState('')
  // Set when we arrived here via the AppShell name/email click, so ProfilePanel
  // knows to open straight into editing mode instead of the read-only view.
  const [startProfileEditing, setStartProfileEditing] = useState(false)
  const avatarInputRef = useRef(null)
  const deliveries = useStore((s) => (accountUser ? s.deliveries.filter((d) => d.customerId === accountUser.id) : []))

  // AppShell's name/email button navigates here with state.openEditProfile —
  // jump straight into the Profile section, already in editing mode.
  useEffect(() => {
    if (location.state?.openEditProfile) {
      setActiveSection('profile')
      setStartProfileEditing(true)
      // Clear the flag from history state so refreshing or coming back later
      // doesn't force editing mode again.
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  if (!accountUser) return null

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.')
      return
    }
    try {
      const dataUrl = await readImageAsDataUrl(file)
      updateCurrentUser({ avatarUrl: dataUrl })
      setAvatarError('')
    } catch {
      setAvatarError('Could not load that image. Try a different one.')
    }
  }

  function handleAvatarRemove() {
    updateCurrentUser({ avatarUrl: undefined })
    setAvatarError('')
  }

  const totalOrders = deliveries.length
  const deliveredOrders = deliveries.filter((d) => d.status === 'delivered').length
  const activeOrders = deliveries.filter((d) => d.status !== 'delivered' && d.status !== 'cancelled').length
  const totalSpent = deliveries
    .filter((d) => d.status !== 'cancelled')
    .reduce((sum, delivery) => sum + (Number(delivery.price) || 0), 0)
  const recentDeliveries = [...deliveries].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, 4)

  const handleLogout = () => {
    apiLogout()
    navigate('/auth')
  }

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate('/customer')
    }
  }

  const openModal = (type) => {
    setActiveModal(type)
    setSavedNotice('')
  }

  const closeModal = () => {
    setActiveModal(null)
    setSavedNotice('')
  }

  const savePreferences = () => {
    setSavedNotice('Preferences updated successfully.')
  }

  const activeTitle = SECTIONS.find((section) => section.id === activeSection)?.label ?? 'Account'

  // The top browser-back arrow only belongs on the Account main hub. Once
  // you're inside a section (Profile, Settings, ...) or a modal is open,
  // hide it — each of those already has its own way back (PageHeader's
  // onBack, or closing the sheet), so a second "back" arrow up top is
  // confusing and, per the request, shouldn't reappear until you're back
  // on the main Account list.
  const showTopBackArrow = !activeSection && !activeModal

  return (
    <AppShell hideMobileHeader>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
     

        {!activeSection && (
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">Account</h1>
            <p className="mt-2 text-sm text-slate-500">Profile, settings, help, and shipment history.</p>
          </div>
        )}

        {!activeSection ? (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 text-white">
                    {accountUser.avatarUrl ? (
                      <img src={accountUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    aria-label="Change profile photo"
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-500"
                  >
                    <Camera className="h-2.5 w-2.5" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                {/* Was onClick={ProfilePanel} — passed the component function itself as
                    a handler, which calls its hooks outside of render and throws.
                    Fixed to just switch into the Profile section like the nav buttons below. */}
                <button
                  type="button"
                  onClick={() => setActiveSection('profile')}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-bold text-slate-900">{accountUser.name}</p>
                  <p className="truncate text-xs text-slate-500">{accountUser.email}</p>
                </button>
              </div>
              {avatarError && <p className="mt-2 text-xs text-red-500">{avatarError}</p>}
            </div>

            <nav className="p-2">
              {SECTIONS.map(({ id, label, description, Icon }) => {
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSection(id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{label}</span>
                      <span className="block truncate text-xs text-slate-500">{description}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                )
              })}
                 <div className="mt-2 border-t border-slate-100 pt-2">
                              <button
                                type="button"
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-red-600 transition hover:bg-red-50"
                              >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                                  <LogOut className="h-5 w-5" />
                                </span>
                                <span className="text-sm font-bold">Sign out</span>
                              </button>
                            </div>
            </nav>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <PageHeader
              title={activeTitle}
              subtitle="Account section"
              onBack={() => setActiveSection(null)}
              trailing={
                <button
                  onClick={handleLogout}
                  className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              }
              className="mb-6"
            />

            {activeSection === 'profile' && (
              <ProfilePanel
                user={accountUser}
                totalOrders={totalOrders}
                deliveredOrders={deliveredOrders}
                activeOrders={activeOrders}
                startEditing={startProfileEditing}
                onAvatarChange={handleAvatarChange}
                onAvatarRemove={handleAvatarRemove}
                avatarError={avatarError}
              />
            )}

            {activeSection === 'settings' && (
              <SettingsPanel
                preferences={preferences}
                setPreferences={setPreferences}
                savedNotice={savedNotice}
                savePreferences={savePreferences}
                openModal={openModal}
              />
            )}

            {activeSection === 'help' && <HelpPanel />}

            {activeSection === 'history' && <HistoryPanel deliveries={recentDeliveries} />}
          </section>
        )}
      </main>

      <BottomSheet
        open={!!activeModal}
        onOpenChange={(value) => { if (!value) closeModal() }}
        title={activeModal === 'password' ? 'Change password' : 'Notification preferences'}
        description={activeModal === 'password' ? 'Set a new password for your account.' : 'Choose how you want alerts delivered.'}
        footer={
          <button
            onClick={closeModal}
            className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            {activeModal === 'password' ? 'Save password' : 'Confirm'}
          </button>
        }
      >
        {activeModal === 'password' ? (
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter new password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600"
          />
        ) : (
          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <input type="checkbox" checked={preferences.email} onChange={() => setPreferences((prev) => ({ ...prev, email: !prev.email }))} className="h-4 w-4 rounded text-emerald-600" />
              <span className="text-sm text-slate-700">Email pushes</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <input type="checkbox" checked={preferences.sms} onChange={() => setPreferences((prev) => ({ ...prev, sms: !prev.sms }))} className="h-4 w-4 rounded text-emerald-600" />
              <span className="text-sm text-slate-700">SMS updates</span>
            </label>
          </div>
        )}
      </BottomSheet>
    </AppShell>
  )
}

function ProfilePanel({ user, totalOrders, deliveredOrders, activeOrders, startEditing = false, onAvatarChange, onAvatarRemove, avatarError }) {
  const [editing, setEditing] = useState(startEditing)
  const [name, setName] = useState(user.name)
  const [newPassword, setNewPassword] = useState('')
  const [notice, setNotice] = useState('')
  const avatarInputRef = useRef(null)

  // If the parent flips startEditing after this component already mounted
  // (arriving via the AppShell shortcut on an already-open Account page),
  // pick that up too.
  useEffect(() => {
    if (startEditing) setEditing(true)
  }, [startEditing])

  function saveProfile() {
    updateMe({ name: name.trim() || user.name })
    setNewPassword('')
    setEditing(false)
    setNotice(newPassword ? 'Profile updated. Password captured for this demo.' : 'Profile updated.')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5">
        <div className="relative shrink-0">
          <div className="flex h-28 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-slate-300" />
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-500"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarChange}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">Profile photo</p>
          <p className="mt-1 text-sm text-slate-500">A clear passport-style photo helps riders and support recognize you.</p>
          {user.avatarUrl && (
            <button
              type="button"
              onClick={onAvatarRemove}
              className="mt-2 text-xs font-semibold text-red-500 hover:underline"
            >
              Remove photo
            </button>
          )}
          {avatarError && <p className="mt-2 text-xs text-red-500">{avatarError}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-5">
        <div>
          <p className="text-sm font-bold text-slate-900">Profile information</p>
          <p className="mt-1 text-sm text-slate-500">Edit your account name and password directly here.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (editing) {
              saveProfile()
            } else {
              setEditing(true)
              setNotice('')
            }
          }}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          {editing ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editing ? 'Save changes' : 'Edit profile'}
        </button>
      </div>

      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

      {editing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <EditableField label="Full name" value={name} onChange={setName} />
          {/* Email is locked everywhere — shown as read-only even in editing mode,
              with a note pointing to support instead of an editable input. */}
          <LockedField label="Email" value={user.email} note="Contact support to change your email." />
          <EditableField label="New password" type="password" value={newPassword} onChange={setNewPassword} placeholder="Enter new password" />
          <InfoItem label="Account type" value="Customer" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoItem label="Full name" value={user.name} />
          <InfoItem label="Email" value={user.email} />
          {user.phone && <InfoItem label="Phone" value={user.phone} />}
          <InfoItem label="Account type" value="Customer" />
        </div>
      )}

      <div className="border-t border-slate-100 pt-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700">
          <BarChart3 className="h-4 w-4 text-emerald-600" /> Activity
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total orders" value={totalOrders} />
          <StatCard label="Delivered" value={deliveredOrders} tone="text-emerald-600" />
          <StatCard label="Active" value={activeOrders} tone="text-orange-500" />
        </div>
      </div>
    </div>
  )
}

function SettingsPanel({ preferences, setPreferences, savedNotice, savePreferences, openModal }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <ActionButton icon={Shield} title="Change Password" text="Update security" onClick={() => openModal('password')} />
        {/* Update Email removed from the reachable actions — email is locked account-wide. */}
        <ActionButton icon={Mail} title="Email" text="Contact support to change" disabled />
        <ActionButton icon={Bell} title="Notifications" text="Manage alerts" onClick={() => openModal('notifications')} />
      </div>

      {savedNotice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{savedNotice}</div>}

      <div className="space-y-3">
        <PreferenceRow title="Email notifications" text="Get updates about your orders" checked={preferences.email} onChange={() => setPreferences((prev) => ({ ...prev, email: !prev.email }))} />
        <PreferenceRow title="SMS notifications" text="Receive text messages for deliveries" checked={preferences.sms} onChange={() => setPreferences((prev) => ({ ...prev, sms: !prev.sms }))} />
        <PreferenceRow title="Marketing emails" text="Receive special offers and promotions" checked={preferences.marketing} onChange={() => setPreferences((prev) => ({ ...prev, marketing: !prev.marketing }))} />
      </div>

      <button onClick={savePreferences} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
        <Check className="h-4 w-4" /> Confirm preferences
      </button>
    </div>
  )
}

function HelpPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-900">Need support?</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">Get help with delivery tracking, account issues, bookings, or payment questions.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/customer/help" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
            <LifeBuoy className="h-4 w-4" /> Open help center
          </Link>
          <a href="tel:08106146952" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <PhoneCall className="h-4 w-4" /> Call support
          </a>
        </div>
      </div>
    </div>
  )
}

function HistoryPanel({ deliveries }) {
  return (
    <div className="space-y-4">
      {deliveries.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">No shipment history yet.</div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {deliveries.map((delivery) => (
            <Link key={delivery.id} to={`/customer/track/${delivery.id}`} className="flex items-center gap-3 px-4 py-4 transition hover:bg-slate-50">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Package className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900">{delivery.id}</span>
                <span className="block truncate text-xs text-slate-500">{delivery.pickup?.address} to {delivery.dropoff?.address}</span>
              </span>
              <span className="hidden items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500 sm:inline-flex">
                <Clock className="h-3 w-3" /> {STATUS_LABEL[delivery.status]}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </Link>
          ))}
        </div>
      )}

      <Link to="/customer/history" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
        View full history <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function EditableField({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="block rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-600"
      />
    </label>
  )
}

// Read-only counterpart to EditableField, used for the email field so it
// visually matches the other fields in the editing grid but can't be typed
// into or submitted.
function LockedField({ label, value, note }) {
  return (
    <div className="block rounded-xl bg-slate-50 px-4 py-3">
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Lock className="h-3 w-3" /> {label}
      </span>
      <p className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500">
        {value}
      </p>
      {note && <p className="mt-1.5 text-[11px] text-slate-400">{note}</p>}
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function StatCard({ label, value, tone = 'text-emerald-600' }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center">
      <p className={`font-display text-2xl font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  )
}

function ActionButton({ icon: Icon, title, text, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
        disabled
          ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
          : 'border-slate-200 hover:bg-slate-50'
      }`}
    >
      <Icon className="h-5 w-5 text-slate-400" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-700">{title}</span>
        <span className="block truncate text-xs text-slate-500">{text}</span>
      </span>
    </button>
  )
}

function PreferenceRow({ title, text, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded text-emerald-600" />
      <span>
        <span className="block text-sm font-semibold text-slate-700">{title}</span>
        <span className="block text-xs text-slate-500">{text}</span>
      </span>
    </label>
  )
}
