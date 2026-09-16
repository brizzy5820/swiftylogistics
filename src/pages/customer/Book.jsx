import { useEffect, useMemo, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MapPin, ArrowLeft, ArrowRight,
  CheckCircle2, ArrowLeftRight, Navigation, AlertTriangle, Radio,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { MobileRouteMap, RouteMapPanel } from '@/components/mobile-route-map'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useStore } from '@/lib/mock-store'
import { createAddress, createDelivery } from '../../services/api'
import { reverseGeocode } from '@/lib/address-suggestions'




  // Local buffer so the field can hold "" or a half-typed value while editing,
  // instead of being clamped (and visibly reset) on every keystroke. Commits
  // back to `weight` only on blur / Enter.
  function WeightSlider({ weight, setWeight, wMeta, weightSurcharge }) {
      const pct = Math.round(((weight - 1) / 49) * 100)
  const thresholdPct = Math.round(((20 - 1) / 49) * 100)
  const [inputValue, setInputValue] = useState(String(weight))
  useEffect(() => {
    setInputValue(String(weight))
  }, [weight])

  function commitInput(raw) {
    if (raw === '') {
      setInputValue(String(weight))
      return
    }

    const parsed = Number(raw)
    const clamped = Number.isFinite(parsed) ? Math.min(50, Math.max(1, Math.round(parsed))) : weight
    setWeight(clamped)
    setInputValue(String(clamped))
  }

  function handleInputChange(raw) {
    setInputValue(raw)

    if (raw === '') return

    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return

    const clamped = Math.min(50, Math.max(1, Math.round(parsed)))
    setWeight(clamped)
  }

  return (
    <div className="rounded-2xl  bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">Package weight</p>
        <span
          className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: wMeta.bg, borderColor: wMeta.border, color: wMeta.text }}
        >
          {wMeta.label}
        </span>
      </div>

      {/* taller hit area (h-8 vs h-5) makes dragging easier to grab, track stays visually h-2 */}
      <div className="relative mb-1 flex h-8 items-center">
        <div className="absolute inset-x-0 h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-75"
            style={{ width: `${pct}%`, background: wMeta.color }}
          />
        </div>
        <div
          className="absolute top-0 bottom-0 flex items-center pointer-events-none"
          style={{ left: `${thresholdPct}%` }}
        >
          <div className="h-4 w-px bg-slate-400 opacity-60" />
        </div>
        {/* touchAction: 'none' stops touch-drag from being swallowed as a page scroll */}
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="absolute inset-x-0 h-full w-full cursor-pointer opacity-0"
          style={{ zIndex: 2, touchAction: 'none' }}
        />
        <div
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white shadow-md"
          style={{ left: `calc(${pct}% - 10px)`, background: wMeta.color, zIndex: 1 }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 mb-4">
        <span>1 kg</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-px bg-slate-400" />
          20 kg limit
        </span>
        <span>50 kg</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <input
            type="number"
            min={1}
            max={50}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={(e) => commitInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="w-14 bg-transparent text-sm font-bold text-slate-800 outline-none"
          />
          <span className="text-xs text-slate-400">kg</span>
        </div>
        <div
          className="flex flex-1 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium"
          style={{ background: wMeta.bg, borderColor: wMeta.border, color: wMeta.text }}
        >
          {weight > 20 ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Extra charge: ₦{weightSurcharge}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              No surcharge
            </>
          )}
        </div>
      </div>
    </div>
  )
}
/* ─── Static data ────────────────────────────────────────────────────── */
const ADDRESS_SUGGESTIONS = [
  { label: 'Lekki Phase 1',   coords: { lat: 6.4328, lng: 3.4382 } },
  { label: 'Victoria Island', coords: { lat: 6.4270, lng: 3.4300 } },
  { label: 'Ikeja City Mall', coords: { lat: 6.5964, lng: 3.3426 } },
  { label: 'Yaba Tech',       coords: { lat: 6.5058, lng: 3.3799 } },
  { label: 'Surulere',        coords: { lat: 6.4923, lng: 3.3652 } },
  { label: 'Magodo Estate',   coords: { lat: 6.6100, lng: 3.3420 } },
]

const PACKAGE_TYPES = [
  { id: 'Express', label: 'Express', desc: 'Fastest delivery', image: '/sedan.png', surcharge: 4, accent: '#eab308' },
  { id: 'Cargo', label: 'Cargo', desc: 'Heavy & bulky items', image: '/express-delivery.png', surcharge: 8, accent: '#3b82f6' },
  { id: 'Electric', label: 'Motorbike', desc: 'Small items delivery', image: '/motor.png', surcharge: 2, accent: '#16a34a' },
]

const STEPS = ['Route', 'Package', 'Review']

/* ─── Pure helpers ───────────────────────────────────────────────────── */
function filterSuggestions(query) {
  if (!query.trim()) return ADDRESS_SUGGESTIONS
  return ADDRESS_SUGGESTIONS.filter((s) =>
    s.label.toLowerCase().includes(query.toLowerCase())
  )
}

function resolveCoords(label, fallback) {
  const match = ADDRESS_SUGGESTIONS.find(
    (s) => s.label.toLowerCase() === label.toLowerCase()
  )
  return match ? match.coords : fallback
}

async function fetchLagosSuggestions(query, signal) {
  if (!query.trim() || query.trim().length < 2) {
    return ADDRESS_SUGGESTIONS
  }

  const viewbox = [2.60, 6.80, 4.00, 5.10].join(',')
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=ng&viewbox=${viewbox}&bounded=1&q=${encodeURIComponent(query)}`

  try {
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
      signal,
    })
    if (!response.ok) throw new Error('Search failed')
    const items = await response.json()
    return items.map((item) => ({
      label: item.display_name,
      coords: { lat: Number(item.lat), lng: Number(item.lon) },
    }))
  } catch (error) {
    return ADDRESS_SUGGESTIONS
  }
}

function haversine(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function weightMeta(w) {
  if (w <= 10) return { label: 'Light',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' }
  if (w <= 20) return { label: 'Standard', color: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#b45309' }
  return           { label: 'Heavy — surcharge applies', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' }
}

/* ─── Map sub-components ─────────────────────────────────────────────── */



  /* ── Shared address suggestion dropdown ── */
  function SuggestionDropdown({
    type,
    items,
    show,
    query,
    onSelectAddress,
    onUseMyLocation,
    geoLabel,
    geoReady,
  }) {
    if (!show) return null

    const isPickup = type === 'pickup'

    return (
      <div
        className="absolute left-0 right-0 top-[calc(100%+8px)] z-[1000] max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        style={{ minWidth: 0 }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {isPickup && (
          <button
            type="button"
            onClick={() => onUseMyLocation(type)}
            disabled={!geoReady}
            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-emerald-50 disabled:opacity-40"
          >
            <Navigation className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate text-sm font-medium text-emerald-700">{geoLabel}</span>
          </button>
        )}

        {items.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-400">No results</p>
        ) : (
          items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectAddress(type, item)}
              className={[
                'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50',
                query === item.label ? 'bg-slate-50 font-semibold text-emerald-600' : '',
              ].join(' ')}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <span className="truncate">{item.label}</span>
            </button>
          ))
        )}
      </div>
    )
  }

  /* ── Address input field ── */
  function AddressField({
    type,
    query,
    setQuery,
    showDrop,
    setShowDrop,
    suggestions,
    geoLabel,
    geoReady,
    onUseMyLocation,
    onSelectAddress,
  }) {
    const inputRef = useRef(null)
    const [focused, setFocused] = useState(false)

    const isPickup = type === 'pickup'
    const label = isPickup ? 'Pickup' : 'Dropoff'

    const handleFocus = () => {
      setFocused(true)
      setShowDrop(true)
    }

    const handleBlur = () => {
      setFocused(false)
      window.setTimeout(() => setShowDrop(false), 150)
    }

    return (
      <div className={`relative ${showDrop ? 'z-30' : 'z-0'}`} style={{ overflow: 'visible' }}>
        <div>
          <div
            onMouseDown={() => {
              setFocused(true)
              setShowDrop(true)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
            onClick={() => {
              setFocused(true)
              setShowDrop(true)
              inputRef.current?.focus()
            }}
            className={[
              'flex min-w-0 cursor-text items-center gap-3 rounded-xl border bg-slate-100 px-4 py-3.5 transition-colors duration-150',
              focused ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.10)]' : 'border-transparent',
            ].join(' ')}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center">
              {isPickup ? (
                <span className="h-3.5 w-3.5 rounded-full border-[2.5px] border-black bg-white" />
              ) : (
                <span className="h-3 w-3 bg-black" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowDrop(true)
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={isPickup ? 'Pickup location' : 'Dropoff destination'}
              autoCapitalize="words"
              autoCorrect="off"
              className="min-w-0 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
            {query ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery('')
                  setShowDrop(true)
                  inputRef.current?.focus()
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200"
                aria-label={`Clear ${label.toLowerCase()}`}
              >
                <X className="h-4 w-4" />
              </button>
            ) : isPickup ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onUseMyLocation(type)}
                className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-900 disabled:text-slate-300"
                disabled={!geoReady}
                aria-label="Use current location"
              >
                <Navigation className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <SuggestionDropdown
          type={type}
          items={suggestions}
          show={showDrop}
          query={query}
          onSelectAddress={onSelectAddress}
          onUseMyLocation={onUseMyLocation}
          geoLabel={geoLabel}
          geoReady={geoReady}
        />
      </div>
    )
  }
/* ─── Main page ──────────────────────────────────────────────────────── */
export default function Book() {
  const user = useRequireAuth('customer')
  const navigate = useNavigate()

  /* form state */
  const [step, setStep]               = useState(0)
  const [pickupQuery, setPickupQuery] = useState('')
  const [dropoffQuery, setDropoffQuery] = useState('')
  const [pickupCoords, setPickupCoords] = useState({ lat: 6.4328, lng: 3.4382 })
  const [dropoffCoords, setDropoffCoords] = useState({ lat: 6.4270, lng: 3.4300 })
  const [confirmedPickup, setConfirmedPickup]   = useState('Lekki Phase 1')
  const [confirmedDropoff, setConfirmedDropoff] = useState('Victoria Island')
  const [showPickupDrop, setShowPickupDrop]   = useState(false)
  const [showDropoffDrop, setShowDropoffDrop] = useState(false)
  const [pickupSuggestions, setPickupSuggestions] = useState(ADDRESS_SUGGESTIONS)
  const [dropoffSuggestions, setDropoffSuggestions] = useState(ADDRESS_SUGGESTIONS)
  const [pkg, setPkg]     = useState('Express')
  const [weight, setWeight] = useState(5)
  const [note, setNote]   = useState('')

  /* map UI state */

  /* live, in-progress delivery for this customer — drives the live map */
  const activeDelivery = useStore((s) => {
    if (!user) return null
    return s.deliveries.find(
      (d) => d.customerId === user.id && (d.type === 'delivery' || !d.type) && !['delivered', 'cancelled'].includes(d.status),
    ) || null
  })
  const liveCourier = activeDelivery?.courierPosition || null
  const liveRider = useStore((s) => activeDelivery?.riderId ? s.users.find((u) => u.id === activeDelivery.riderId) : null)
  const liveCourierInfo = activeDelivery ? {
    riderName: activeDelivery.riderName || 'Driver en route',
    rideType: activeDelivery.packageType,
    plateNumber: liveRider?.plateNumber,
    phone: liveRider?.phone,
  } : null

  /* geolocation */
  const [geoCoords, setGeoCoords]   = useState(null)
  const [geoLabel, setGeoLabel]     = useState('Detecting location…')
  const [geoReady, setGeoReady]     = useState(false)

  /* ── Geolocation on mount ── */
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setGeoCoords(coords)
        setGeoLabel(`Current location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`)
        setGeoReady(true)
        reverseGeocode(coords).then((label) => {
          if (label) setGeoLabel(label)
        })
      },
      () => setGeoLabel('Location unavailable')
    )
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetchLagosSuggestions(pickupQuery, controller.signal).then((items) => {
        if (!controller.signal.aborted) setPickupSuggestions(items)
      })
    }, 250)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [pickupQuery])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetchLagosSuggestions(dropoffQuery, controller.signal).then((items) => {
        if (!controller.signal.aborted) setDropoffSuggestions(items)
      })
    }, 250)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [dropoffQuery])

  /* ── Scroll top on step change ── */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  /* ── Derived values ── */
  const km = useMemo(
    () => Math.round(haversine(pickupCoords, dropoffCoords) * 10) / 10,
    [pickupCoords, dropoffCoords]
  )
  const selectedPkg     = PACKAGE_TYPES.find((p) => p.id === pkg) || PACKAGE_TYPES[0]
  const weightSurcharge = weight > 20 ? Math.round((weight - 20) * 50) : 0
  const price           = Math.round(km * 3 + selectedPkg.surcharge + weightSurcharge)
  const eta             = Math.max(5, Math.round(km * 4))
  const wMeta           = weightMeta(weight)

  const routeValid   = pickupQuery.trim() && dropoffQuery.trim() &&
                       pickupQuery.trim().toLowerCase() !== dropoffQuery.trim().toLowerCase()
  const packageValid = weight >= 1 && weight <= 50
  const advanceBlocked = (step === 0 && !routeValid) || (step === 1 && !packageValid)

  if (!user) return null

  /* ── Address selection handlers ── */
  function selectAddress(type, item) {
    if (type === 'pickup') {
      setPickupQuery(item.label)
      setPickupCoords(item.coords)
      setConfirmedPickup(item.label)
      setShowPickupDrop(false)
    } else {
      setDropoffQuery(item.label)
      setDropoffCoords(item.coords)
      setConfirmedDropoff(item.label)
      setShowDropoffDrop(false)
    }
  }

  function useMyLocation(type) {
    if (!geoCoords) return
    if (type === 'pickup') {
      setPickupQuery(geoLabel)
      setPickupCoords(geoCoords)
      setConfirmedPickup(geoLabel)
      setShowPickupDrop(false)
    } else {
      setDropoffQuery(geoLabel)
      setDropoffCoords(geoCoords)
      setConfirmedDropoff(geoLabel)
      setShowDropoffDrop(false)
    }
  }

  function swapAddresses() {
    const pq = pickupQuery, dq = dropoffQuery
    const pc = pickupCoords, dc = dropoffCoords
    const cp = confirmedPickup, cd = confirmedDropoff
    setPickupQuery(dq);  setDropoffQuery(pq)
    setPickupCoords(dc); setDropoffCoords(pc)
    setConfirmedPickup(cd); setConfirmedDropoff(cp)
    setShowPickupDrop(false); setShowDropoffDrop(false)
  }

  function handleAdvance() {
    if (advanceBlocked) return
    if (step === 0) {
      setPickupCoords(resolveCoords(pickupQuery, pickupCoords))
      setDropoffCoords(resolveCoords(dropoffQuery, dropoffCoords))
      setConfirmedPickup(pickupQuery)
      setConfirmedDropoff(dropoffQuery)
    }
    setStep((s) => Math.min(s + 1, 2))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const [pickup, dropoff] = await Promise.all([
        createAddress({
          label: 'Pickup',
          addressLine: confirmedPickup,
          city: 'Lagos',
          state: 'Lagos',
          coordinates: {
            latitude: pickupCoords.lat,
            longitude: pickupCoords.lng,
          },
        }),
        createAddress({
          label: 'Drop-off',
          addressLine: confirmedDropoff,
          city: 'Lagos',
          state: 'Lagos',
          coordinates: {
            latitude: dropoffCoords.lat,
            longitude: dropoffCoords.lng,
          },
        }),
      ])

      const delivery = await createDelivery({
        pickupAddress: pickup._id || pickup.id,
        dropoffAddress: dropoff._id || dropoff.id,
        packageType: pkg,
        weightKg: weight,
        note: note.trim(),
      })

      navigator.clipboard?.writeText(delivery.trackingId)
      navigate('/customer/track/' + activeDelivery.trackingId)
    } catch (error) {
      window.alert(error.message || 'Unable to create delivery.')
    }
  }

  /* ════════════════════════════════════════════
     SUB-COMPONENTS (defined inside so they have
     access to state via closure — no prop drilling)
  ════════════════════════════════════════════ */

  /* ── Step progress bar ── */
  function StepBar() {
    return (
    
      <div className="mb-8 flex items-center">
        {STEPS.map((label, idx) => {
          const done   = step > idx
          const active = step === idx
          const canJump = idx < step
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!canJump}
                onClick={() => canJump && setStep(idx)}
                className={[
                  'flex flex-col items-center gap-1.5',
                  canJump ? 'cursor-pointer' : 'cursor-default',
                ].join(' ')}
              >
                {/* circle */}
                <div
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300',
                    done   ? 'border-emerald-600 bg-emerald-600 text-white'
                    : active ? 'border-emerald-600 bg-white text-emerald-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]'
                    :          'border-slate-200 bg-white text-slate-400',
                  ].join(' ')}
                >
                  {done
                    ? <CheckCircle2 className="h-3.5 w-3.5" />
                    : <span>{idx + 1}</span>
                  }
                </div>
                {/* label */}
                <span
                  className={[
                    'hidden text-[10px] font-semibold uppercase tracking-widest transition-colors sm:block',
                    active ? 'text-emerald-600'
                    : done  ? 'text-slate-500'
                    :         'text-slate-300',
                  ].join(' ')}
                >
                  {label}
                </span>
              </button>

              {/* connector line (not after last) */}
              {idx < STEPS.length - 1 && (
                <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: step > idx ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }


  /* ── Weight slider with colour track ── */

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
   const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate('/customer')
    }
  }
  return (
    <AppShell hideMobileHeader>
      <main className=" px-4 pb-28 lg:pt-5 sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto ">
       

          {/* Page grid */}
          <div className="grid gap-6 lg:mt-4 md:mt-4  lg:grid-cols-2">
            {/* ── Left: form column ── */}
            <div className="min-w-0 lg:mt-5 md:mt-5  space-y-4">
              {/* Header card */}
              {/* <div className="rounded-2xl border mt-5 border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      New delivery
                    </p>
                    <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Book in 3 steps
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                      Set your route, choose a package type, then confirm.
                    </p>
                  </div>
                  <div className="inline-flex shrink-0 items-center rounded-full bg-primary/8 px-3.5 py-1.5 text-xs font-bold text-primary">
                    Step {step + 1} / 3
                  </div>
                </div>
              </div> */}
                 {/* Back button */}
          <div className='flex gap-3 items-center mt-5 mb-5'>
            {/* <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex h-10 w-10 items-center justify-center  text-slate-600  transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button> */}
           <h1 className="mt-2 font-display md:px-6 lg:px-6 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Place a Delivery</h1>
          </div>

              {/* Main form card */}
              <div className="rounded-2xl  sm:px-7">
                <StepBar />

                <form onSubmit={handleSubmit}>
                  {/* ─── STEP 0: Route ─── */}
                  {step === 0 && (
                    <div className="space-y-3">
                      <div className="relative space-y-6 rounded-2xl bg-white p-4 shadow-sm">
                        <div className="pointer-events-none absolute left-[27px] top-[52px] h-6 w-px border-l-2 border-dashed border-slate-300" />
                      <AddressField
                        type="pickup"
                        query={pickupQuery}
                        setQuery={setPickupQuery}
                        showDrop={showPickupDrop}
                        setShowDrop={setShowPickupDrop}
                        suggestions={pickupSuggestions}
                        geoLabel={geoLabel}
                        geoReady={geoReady}
                        onUseMyLocation={useMyLocation}
                        onSelectAddress={selectAddress}
                      />

                      <AddressField
                        type="dropoff"
                        query={dropoffQuery}
                        setQuery={setDropoffQuery}
                        showDrop={showDropoffDrop}
                        setShowDrop={setShowDropoffDrop}
                        suggestions={dropoffSuggestions}
                        geoLabel={geoLabel}
                        geoReady={geoReady}
                        onUseMyLocation={useMyLocation}
                        onSelectAddress={selectAddress}
                      />
                      </div>

                 

                      {/* Route summary mini-card */}
                    
                    </div>
                  )}

                  {/* ─── STEP 1: Package ─── */}
                  {step === 1 && (
                    <div className="space-y-5">
                      {/* Package type picker */}
                      <div>
                        <p className="mb-3 text-sm font-semibold text-slate-700">
                          Choose a service
                        </p>
                        <div className="grid gap-3">
                          {PACKAGE_TYPES.map(({ id, label, desc, image, surcharge }) => {
                            const active = pkg === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setPkg(id)}
                                className={[
                                  "group relative flex items-stretch gap-4 rounded-2xl border p-3 text-left transition-all duration-200",
                                  active
                                    ? "border-emerald-600 bg-emerald-600/5 shadow-md ring-2 ring-emerald-600/10"
                                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
                                ].join(" ")}
                              >
                                {active && (
                                  <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600">
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                  </span>
                                )}
                                <span className=" h-10 w-12 shrink-0 overflow-hidden rounded-xl lg:h-20 sm:w-24 ">
                                  <img src={image} alt="" className="h-full w-full object-cover " />
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col justify-center pr-7">
                                  <span
                                    className={`text-sm font-semibold ${active ? "text-emerald-600" : "text-slate-700"}`}
                                  >
                                    {label}
                                  </span>
                                  <span className="mt-1 text-xs leading-5 text-slate-500">{desc}</span>
                                  <span className="mt-2 text-xs font-bold text-emerald-600">
                                    Est. ₦{Math.round(km * 3 + surcharge)}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Weight */}
                      <WeightSlider
                        weight={weight}
                        setWeight={setWeight}
                        wMeta={wMeta}
                        weightSurcharge={weightSurcharge}
                      />

                      {/* Special instructions */}
                      <div className="rounded-2xl bg-white p-4">
                        <p className="mb-2 text-sm font-semibold text-slate-700">
                          Special instructions
                        </p>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          placeholder="e.g. Call on arrival, fragile contents, leave at gate…"
                          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50"
                        />
                      </div>
                    </div>
                  )}

                  {/* ─── STEP 2: Review ─── */}
                  {step === 2 && (
                    <div className="space-y-4">
                      {/* Route summary */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Route
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                              <div className="h-2 w-2 rounded-full bg-emerald-600" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                                Pickup
                              </p>
                              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                {confirmedPickup}
                              </p>
                            </div>
                          </div>
                          <div className="ml-3 h-5 w-px bg-slate-200" />
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                              <div className="h-2 w-2 rounded-full bg-green-600" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                                Dropoff
                              </p>
                              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                {confirmedDropoff}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {[
                            { label: "Distance", val: `${km} km` },
                            { label: "ETA", val: `${eta} min` },
                          ].map(({ label, val }) => (
                            <div key={label} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                                {label}
                              </p>
                              <p className="mt-1 text-base font-bold text-slate-800">{val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Package summary */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Package
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Type", val: pkg },
                            { label: "Weight", val: `${weight} kg` },
                            { label: "Notes", val: note || "None", small: true },
                          ].map(({ label, val, small }) => (
                            <div key={label} className="rounded-xl bg-white px-3 py-3 shadow-sm">
                              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                                {label}
                              </p>
                              <p
                                className={`mt-1 font-semibold text-slate-800 leading-snug ${small ? "text-xs line-clamp-2" : "text-sm"}`}
                              >
                                {val}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400">
                            Total estimate
                          </p>
                          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                            ₦{price.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                          Ready to confirm
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── Navigation buttons ─── */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={() => setStep((s) => Math.max(s - 1, 0))}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                      >
                        Back
                      </button>
                    )}

                    {step < 2 ? (
                      <button
                        type="button"
                        onClick={handleAdvance}
                        disabled={advanceBlocked}
                        className={[
                          "flex items-center gap-2 bg-emerald-600 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-95",
                          advanceBlocked
                            ? "cursor-not-allowed opacity-50 text-white shadow-none"
                            : " text-white hover:bg-emerald-500",
                        ].join(" ")}
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-95 transition-all"
                      >
                        Confirm booking
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Inline validation hints */}
                  {advanceBlocked && step === 0 && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-rose-500">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Enter different pickup and destination to continue.
                    </p>
                  )}
                  {advanceBlocked && step === 1 && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-rose-500">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Weight must be between 1 and 50 kg.
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* ── Right: desktop map aside ── */}
            <aside className="hidden lg:block">
              <RouteMapPanel
                pickup={activeDelivery ? activeDelivery.pickup.coords : pickupCoords}
                dropoff={activeDelivery ? activeDelivery.dropoff.coords : dropoffCoords}
                courier={liveCourier}
                courierInfo={liveCourierInfo}
                destination={activeDelivery ? activeDelivery.dropoff.coords : dropoffCoords}
                activeLabel={activeDelivery ? `Live · ${activeDelivery.id}` : null}
              />
            </aside>
          </div>
        </div>
      </main>

      {/* Mobile floating map (lg hidden handled inside component) */}
      <MobileRouteMap
        pickup={activeDelivery ? activeDelivery.pickup.coords : pickupCoords}
        dropoff={activeDelivery ? activeDelivery.dropoff.coords : dropoffCoords}
        courier={liveCourier}
        courierInfo={liveCourierInfo}
        destination={activeDelivery ? activeDelivery.dropoff.coords : dropoffCoords}
        activeLabel={activeDelivery ? `Tracking · ${activeDelivery.id}` : 'Route preview'}
        description={`${pickupQuery || 'Pickup'} → ${dropoffQuery || 'Dropoff'}`}
      />
    </AppShell>
  );
}
