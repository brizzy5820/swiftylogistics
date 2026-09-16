import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  CreditCard,
  LogOut,
  ArrowLeft,
  Camera,
  ChevronRight,
  Pencil,
  Save,
  Car,
  Palette,
  Hash,
  IdCard,
  Fingerprint,
  Landmark,
  AlertCircle,
  Settings,
  Shield,
  Mail,
  Bell,
  Check,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { BottomSheet } from '@/components/bottom-sheet'
import { PageHeader } from '@/components/page-header'
import { useRequireAuth } from '@/lib/use-require-auth'
import { signOut, updateCurrentUser, changePassword, useStore, VEHICLE_TYPES } from '@/lib/api-store'
import { readImageAsDataUrl } from '@/lib/image'

const SECTIONS = [
  { id: 'profile', label: 'Profile', description: 'Name, email, and phone', Icon: User },
  { id: 'payment', label: 'Payment & verification', description: 'Vehicle, license, and bank details', Icon: CreditCard },
  { id: 'settings', label: 'Settings', description: 'Security and notification preferences', Icon: Settings },
]

function isPaymentIncomplete(user) {
  return !user.vehicleType || !user.plateNumber || !user.licenseNumber || !user.nin || !user.bankName || !user.accountNumber
}

export default function RiderAccount() {
  const user = useRequireAuth('rider')
  const navigate = useNavigate()
  const liveUser = useStore((s) => (s.session ? s.users.find((item) => item.id === s.session.userId) : null))
  const accountUser = liveUser ?? user
  const [activeSection, setActiveSection] = useState(null)
  const [avatarError, setAvatarError] = useState('')
  const avatarInputRef = useRef(null)
  const [activeModal, setActiveModal] = useState(null)
  const [email, setEmail] = useState(accountUser?.email ?? '')
  const [password, setPassword] = useState('')
  const [preferences, setPreferences] = useState({ email: true, sms: true, marketing: false })
  const [savedNotice, setSavedNotice] = useState('')

  if (!accountUser) return null

  const handleLogout = () => {
    signOut()
    navigate('/auth')
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

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate('/rider')
    }
  }

  const activeTitle = SECTIONS.find((section) => section.id === activeSection)?.label ?? 'Account'
  const paymentIncomplete = isPaymentIncomplete(accountUser)

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
       

        {!activeSection && (
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">Account</h1>
            <p className="mt-2 text-sm text-slate-500">Profile and payment & verification details.</p>
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
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{accountUser.name}</p>
                  <p className="truncate text-xs text-slate-500">{accountUser.email}</p>
                </div>
              </div>
              {avatarError && <p className="mt-2 text-xs text-red-500">{avatarError}</p>}
            </div>

            <nav className="p-2">
              {SECTIONS.map(({ id, label, description, Icon }) => (
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
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {label}
                      {id === 'payment' && paymentIncomplete && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-red-400" />
                      )}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{description}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ))}

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
            />

            {activeSection === 'profile' && (
              <ProfilePanel
                user={accountUser}
                onAvatarChange={handleAvatarChange}
                onAvatarRemove={handleAvatarRemove}
                avatarError={avatarError}
              />
            )}
            {activeSection === 'payment' && <PaymentPanel user={accountUser} />}
            {activeSection === 'settings' && (
              <SettingsPanel
                preferences={preferences}
                setPreferences={setPreferences}
                savedNotice={savedNotice}
                savePreferences={savePreferences}
                openModal={openModal}
              />
            )}
          </section>
        )}
      </main>

      <BottomSheet
        open={!!activeModal}
        onOpenChange={(value) => { if (!value) closeModal() }}
        title={activeModal === 'password' ? 'Change password' : activeModal === 'email' ? 'Update email' : 'Notification preferences'}
        description={activeModal === 'password' ? 'Set a new password for your account.' : activeModal === 'email' ? 'Use a new email address for updates.' : 'Choose how you want alerts delivered.'}
        footer={
          <button
            onClick={async () => {
              if (activeModal === 'password') {
                try { await changePassword(password); setPassword(''); setSavedNotice('Password updated successfully.'); closeModal() }
                catch (error) { setSavedNotice(error.message || 'Unable to update password.') }
              } else if (activeModal === 'email') {
                try { await updateCurrentUser({ email: email.trim() }); setSavedNotice('Email updated successfully.'); closeModal() }
                catch (error) { setSavedNotice(error.message || 'Unable to update email.') }
              } else closeModal()
            }}
            className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            {activeModal === 'password' ? 'Save password' : activeModal === 'email' ? 'Save email' : 'Confirm'}
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
        ) : activeModal === 'email' ? (
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter new email"
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

function ProfilePanel({ user, onAvatarChange, onAvatarRemove, avatarError }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [notice, setNotice] = useState('')
  const avatarInputRef = useRef(null)

  function saveProfile() {
    updateCurrentUser({
      name: name.trim() || user.name,
      email: email.trim() || user.email,
      phone: phone.trim(),
    })
    setEditing(false)
    setNotice('Profile updated.')
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
          <p className="mt-1 text-sm text-slate-500">A clear passport-style photo helps customers and support recognize you.</p>
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
          <p className="mt-1 text-sm text-slate-500">Edit your account name, email, and phone number.</p>
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
          <EditableField label="Email" type="email" value={email} onChange={setEmail} />
          <EditableField label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="+234 91 234 6789" />
          <InfoItem label="Account type" value="Rider" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoItem label="Full name" value={user.name} />
          <InfoItem label="Email" value={user.email} />
          <InfoItem label="Phone" value={user.phone || 'Not set'} />
          <InfoItem label="Account type" value="Rider" />
        </div>
      )}
    </div>
  )
}

function PaymentPanel({ user }) {
  const [editing, setEditing] = useState(false)
  const [vehicleType, setVehicleType] = useState(user.vehicleType ?? '')
  const [vehicleColor, setVehicleColor] = useState(user.vehicleColor ?? '')
  const [plateNumber, setPlateNumber] = useState(user.plateNumber ?? '')
  const [licenseNumber, setLicenseNumber] = useState(user.licenseNumber ?? '')
  const [nin, setNin] = useState(user.nin ?? '')
  const [bankName, setBankName] = useState(user.bankName ?? '')
  const [accountNumber, setAccountNumber] = useState(user.accountNumber ?? '')
  const [notice, setNotice] = useState('')

  const incomplete = isPaymentIncomplete(user)

  function savePayment() {
    updateCurrentUser({
      vehicleType,
      vehicleColor: vehicleColor.trim(),
      plateNumber: plateNumber.trim(),
      licenseNumber: licenseNumber.trim(),
      nin: nin.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
    })
    setEditing(false)
    setNotice('Payment & verification details updated.')
  }

  return (
    <div className="space-y-6">
      {incomplete && !editing && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Your payment & verification details are incomplete. Add them so you can start receiving job payouts.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-5">
        <div>
          <p className="text-sm font-bold text-slate-900">Payment & verification</p>
          <p className="mt-1 text-sm text-slate-500">Your vehicle, license, and bank details.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (editing) {
              savePayment()
            } else {
              setEditing(true)
              setNotice('')
            }
          }}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          {editing ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editing ? 'Save changes' : 'Edit details'}
        </button>
      </div>

      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

      {editing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block rounded-xl bg-slate-50 px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Car className="h-3.5 w-3.5" /> Vehicle type
            </span>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-600"
            >
              <option value="" disabled>
                Select vehicle type
              </option>
              {VEHICLE_TYPES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <EditableField label="Vehicle color" value={vehicleColor} onChange={setVehicleColor} placeholder="e.g. Black" Icon={Palette} />
          <EditableField label="Plate number" value={plateNumber} onChange={setPlateNumber} placeholder="e.g. LND-234-KJ" Icon={Hash} />
          <EditableField label="Driver's license number" value={licenseNumber} onChange={setLicenseNumber} Icon={IdCard} />
          <EditableField label="NIN (National ID Number)" value={nin} onChange={setNin} placeholder="11-digit NIN" Icon={Fingerprint} />
          <EditableField label="Bank name" value={bankName} onChange={setBankName} placeholder="e.g. GTBank" Icon={Landmark} />
          <EditableField label="Bank account number" value={accountNumber} onChange={setAccountNumber} placeholder="10-digit account number" Icon={CreditCard} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoItem label="Vehicle type" value={user.vehicleType || 'Not set'} />
          <InfoItem label="Vehicle color" value={user.vehicleColor || 'Not set'} />
          <InfoItem label="Plate number" value={user.plateNumber || 'Not set'} />
          <InfoItem label="Driver's license number" value={user.licenseNumber || 'Not set'} />
          <InfoItem label="NIN" value={user.nin || 'Not set'} />
          <InfoItem label="Bank name" value={user.bankName || 'Not set'} />
          <InfoItem label="Bank account number" value={user.accountNumber || 'Not set'} />
        </div>
      )}
    </div>
  )
}

function SettingsPanel({ preferences, setPreferences, savedNotice, savePreferences, openModal }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <ActionButton icon={Shield} title="Change Password" text="Update security" onClick={() => openModal('password')} />
        <ActionButton icon={Mail} title="Update Email" text="Change email address" onClick={() => openModal('email')} />
        <ActionButton icon={Bell} title="Notifications" text="Manage alerts" onClick={() => openModal('notifications')} />
      </div>

      {savedNotice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{savedNotice}</div>}

      <div className="space-y-3">
        <PreferenceRow title="Job alerts" text="Get notified about nearby delivery requests" checked={preferences.email} onChange={() => setPreferences((prev) => ({ ...prev, email: !prev.email }))} />
        <PreferenceRow title="SMS updates" text="Receive text messages for job status changes" checked={preferences.sms} onChange={() => setPreferences((prev) => ({ ...prev, sms: !prev.sms }))} />
        <PreferenceRow title="Marketing emails" text="Receive special offers and promotions" checked={preferences.marketing} onChange={() => setPreferences((prev) => ({ ...prev, marketing: !prev.marketing }))} />
      </div>

      <button onClick={savePreferences} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
        <Check className="h-4 w-4" /> Confirm preferences
      </button>
    </div>
  )
}

function ActionButton({ icon: Icon, title, text, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50">
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

function EditableField({ label, value, onChange, type = 'text', placeholder, Icon }) {
  return (
    <label className="block rounded-xl bg-slate-50 px-4 py-3">
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </span>
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

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
