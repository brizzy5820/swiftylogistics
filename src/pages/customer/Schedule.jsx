import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, PackageCheck, ArrowLeft, X } from 'lucide-react'
import { useRequireAuth } from '../../lib/use-require-auth'
import { scheduleDelivery, cancelScheduled, useStore } from '../../lib/mock-store'
import { AppShell } from '../../components/app-shell'
import { DeliveryMap } from '../../components/delivery-map'
import { resolveAddressCoords, reverseGeocode } from '../../lib/address-suggestions'

const PACKAGE_TYPES = ['Express', 'Standard', 'Cargo']
const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '08:00 – 11:00' },
  { id: 'midday', label: 'Midday', time: '11:00 – 14:00' },
  { id: 'afternoon', label: 'Afternoon', time: '14:00 – 17:00' },
  { id: 'evening', label: 'Evening', time: '17:00 – 20:00' },
]

function todayIso() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function combineDateAndSlot(dateIso, slotId) {
  const slot = TIME_SLOTS.find((s) => s.id === slotId)
  if (!slot) return null
  const [from] = slot.time.split(' – ')
  const [hh, mm] = from.split(':').map(Number)
  const d = new Date(dateIso)
  d.setHours(hh || 9, mm || 0, 0, 0)
  return d.getTime()
}

export default function Schedule() {
  const user = useRequireAuth('customer')
  const navigate = useNavigate()
  const [date, setDate] = useState(todayIso())
  const [slot, setSlot] = useState('morning')
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [pickupCoords, setPickupCoords] = useState(null)
  const [dropoffCoords, setDropoffCoords] = useState(null)
  const [pkg, setPkg] = useState('Express')
  const [weight, setWeight] = useState(2)
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')

  const scheduled = useStore((s) => (s.scheduled ?? []).filter((sc) => sc.customerId === user?.id).sort((a, b) => a.scheduledFor - b.scheduledFor))

  // Geocode when pickup/dropoff text changes
  useEffect(() => {
    if (pickup.length < 3) return
    const t = setTimeout(() => {
      resolveAddressCoords(pickup).then((c) => c && setPickupCoords(c))
    }, 350)
    return () => clearTimeout(t)
  }, [pickup])

  useEffect(() => {
    if (dropoff.length < 3) return
    const t = setTimeout(() => {
      resolveAddressCoords(dropoff).then((c) => c && setDropoffCoords(c))
    }, 350)
    return () => clearTimeout(t)
  }, [dropoff])

  function schedule() {
    setError('')
    if (!pickup.trim() || !dropoff.trim()) {
      setError('Please add both pickup and dropoff addresses.')
      return
    }
    const scheduledFor = combineDateAndSlot(date, slot)
    if (!scheduledFor || scheduledFor < Date.now()) {
      setError('Pick a future date and time slot.')
      return
    }
    if (!pickupCoords || !dropoffCoords) {
      setError('We could not locate one of the addresses. Try a clearer name like “Lekki Phase 1”.')
      return
    }
    const created = scheduleDelivery({
      customerId: user.id,
      customerName: user.name,
      pickup: { address: pickup, coords: pickupCoords },
      dropoff: { address: dropoff, coords: dropoffCoords },
      packageType: pkg,
      weightKg: weight,
      note,
      scheduledFor,
    })
    setSubmitted(created)
    setPickup('')
    setDropoff('')
    setPickupCoords(null)
    setDropoffCoords(null)
    setNote('')
  }

  function remove(id) {
    cancelScheduled(id)
  }

  return (
    <AppShell hideMobileHeader>
      <main className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl">Schedule a delivery</h1>
              <p className="mt-0.5 text-sm text-slate-500">Plan a pickup for a future date and time.</p>
            </div>
          </div>

          {submitted ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <Calendar className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-display text-xl font-black text-slate-900">Scheduled!</h2>
              <p className="mt-1 text-sm text-slate-600">
                {submitted.id} is set for {new Date(submitted.scheduledFor).toLocaleString()}.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button onClick={() => setSubmitted(null)} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                  Schedule another
                </button>
                <Link to="/customer/track" className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500">
                  View upcoming
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4">
                {/* Date */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</p>
                  <input
                    type="date"
                    min={todayIso()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Time slot */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Time slot</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSlot(s.id)}
                        className={`rounded-xl border p-3 text-left transition ${
                          slot === s.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-bold">
                          <Clock className="h-3.5 w-3.5" /> {s.label}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">{s.time}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Addresses */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Route</p>
                  <div className="mt-3 space-y-3">
                    <AddressField
                      label="Pickup address"
                      value={pickup}
                      onChange={setPickup}
                      onCoords={setPickupCoords}
                    />
                    <AddressField
                      label="Dropoff address"
                      value={dropoff}
                      onChange={setDropoff}
                      onCoords={setDropoffCoords}
                    />
                  </div>
                </div>

                {/* Package */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Package</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {PACKAGE_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPkg(t)}
                        className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                          pkg === t ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-500">Weight</label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold">{weight} kg</span>
                  </div>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note for the rider (optional)"
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                </div>

                {error && (
                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs text-rose-600">{error}</p>
                )}

                <button
                  onClick={schedule}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500"
                >
                  <Calendar className="h-4 w-4" /> Schedule for {TIME_SLOTS.find((s) => s.id === slot)?.label} on {new Date(date).toLocaleDateString()}
                </button>
              </div>

              {/* Map preview */}
              <div className="space-y-3">
                <div className="sticky top-24 h-72 overflow-hidden rounded-3xl border border-slate-200 lg:h-[480px]">
                  <DeliveryMap
                    pickup={pickupCoords}
                    dropoff={dropoffCoords}
                    className="h-full w-full"
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Why schedule?</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                    <li>• Lock in a pickup window that fits your day</li>
                    <li>• Get a confirmed rider ahead of time</li>
                    <li>• Skip the queue during busy hours</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming list */}
          {scheduled.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Your upcoming pickups</h2>
              <div className="space-y-2">
                {scheduled.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <PackageCheck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{s.pickup?.address} → {s.dropoff?.address}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {new Date(s.scheduledFor).toLocaleString()} · {s.packageType} · {s.id}
                      </p>
                    </div>
                    <button onClick={() => remove(s.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100">
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  )
}

function AddressField({ label, value, onChange, onCoords }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type an address"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
        />
        {value && (
          <button onClick={() => onChange('')} className="rounded-full p-1 text-slate-400 hover:bg-white">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
