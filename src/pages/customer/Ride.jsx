// pages/customer/ride.jsx (or wherever Ride.jsx lives)
import { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { ArrowLeft, CarFront, Check, Navigation, Users,User, Clock3, X, ArrowRight, Radio, MapPin, LoaderCircle, AlertCircle, RefreshCw, Plus, Minus, Wallet, CreditCard } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AppShell } from '../../components/app-shell'
import { DeliveryMap } from '../../components/delivery-map'
import { MobileDrawer } from '../../components/mobile-drawer'
import { useRequireAuth } from '../../lib/use-require-auth'
import { assignAvailableRider, createRide, updateDeliveryStatus, useStore, emit } from '../../lib/api-store'
import { getErrorMessage } from '../../services/api'
import { RIDE_OPTIONS } from '../../data/app-data'
import { ADDRESS_SUGGESTIONS, fetchLagosSuggestions, resolveAddressCoords, reverseGeocode } from '../../lib/address-suggestions'
import { haversineKm } from '../../components/delivery-map'


const LAGOS = { lat: 6.5244, lng: 3.3792 }

const SEARCH_TIMEOUT_MS = 60000
const SEARCH_COUNTDOWN_MS = 60000

function RiderSearchDrawer({ rider, onCancel, onConfirm, onHeightChange, onRetry, timedOut, countdown }) {
  const cardRef = useRef(null)

  const progress = countdown ? countdown / (SEARCH_COUNTDOWN_MS / 1000) : 0

  const riderContent = rider ? (
    <div className="p-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Rider found</p>
        <button onClick={onCancel} aria-label="Close"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700">
          {rider.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-black text-slate-950">{rider.name}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{rider.vehicleType || 'Swifty rider'}{rider.plateNumber ? ` · ${rider.plateNumber}` : ''}</p>
          {rider.phone && <p className="mt-0.5 text-xs text-slate-400">{rider.phone}</p>}
        </div>
        <span className="text-sm font-bold text-amber-500">★ {rider.rating || '5.0'}</span>
      </div>
    </div>
  ) : timedOut ? (
    <div className="p-1 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="font-display text-xl font-black text-slate-950">No rider found</h2>
      <p className="mt-1 text-sm text-slate-500">We couldn't find an available rider near you right now.</p>
      <div className="mt-6">
        <button
          type="button"
          onClick={onRetry}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    </div>
  ) : (
    <div className="p-1">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center item-center rounded-full bg-gray-100 text-gray-600">
          <User className="h-7 w-7 " />
        </div>
        <div>
          <h2 className="font-display text-xl font-black text-slate-950">Finding a rider</h2>
          <p className="mt-1 text-sm text-slate-500">We are checking registered riders near your pickup.</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Searching for riders...</span>
          <span className="font-mono text-semibold text-lg text-black">00:{countdown}s</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-slate-100" aria-label="Searching for a rider">
          <div 
            className="h-full bg-emerald-500 transition-all duration-1000 ease-linear" 
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )

  const footer = rider ? (
    <button type="button" onClick={onConfirm} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400">
      Confirm ride <ArrowRight className="h-4 w-4" />
    </button>
  ) : timedOut ? null : (
    <button type="button" onClick={onCancel} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50">
      <X className="h-4 w-4" /> Cancel search
    </button>
  )

  // Lock the background page while this card is open.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevBodyOverscroll = body.style.overscrollBehavior
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.overscrollBehavior = prevBodyOverscroll
    }
  }, [])

  // Report the card's real, content-driven height (px) so the map behind it
  // can stay clear of it — recalculates automatically when content changes,
  // e.g. switching from "searching" to "rider found".
  useEffect(() => {
    if (!onHeightChange || !cardRef.current) return
    const el = cardRef.current
    const report = () => onHeightChange(el.getBoundingClientRect().height, false)
    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  }, [onHeightChange, rider])

  useEffect(() => {
    return () => onHeightChange?.(0, false)
  }, [onHeightChange])

  return (
    <>
      {/* Mobile: compact card sized to its content — never a big empty sheet. */}
      <div className="fixed inset-x-0 bottom-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={rider ? 'Confirm rider' : 'Finding a rider'}>
        <button type="button" onClick={onCancel} className="absolute inset-0 h-full w-full bg-slate-950/25" aria-label="Close" />
        <div
          ref={cardRef}
          className="relative mx-auto max-h-[75vh] w-full overflow-y-auto overscroll-contain touch-pan-y rounded-t-3xl bg-white p-5 shadow-2xl"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
          {riderContent}
          <div className="mt-5">{footer}</div>
        </div>
      </div>

      {/* Desktop: centered dialog, unaffected by mobile sizing. */}
      <div className="fixed inset-0 z-[60] hidden items-center justify-center bg-slate-950/35 p-4 lg:flex" role="dialog" aria-modal="true" aria-label={rider ? 'Confirm rider' : 'Finding a rider'}>
        <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
          {riderContent}
          <div className={rider ? 'mt-1' : 'mt-5'}>{footer}</div>
        </div>
      </div>
    </>
  )
}

async function geocode(query) {
  const q = (query || '').trim()
  if (q.length < 3) return null
  try {
    const items = await fetchLagosSuggestions(q)
    return items[0]?.coords || null
  } catch {
    return null
  }
}

// variant: 'pickup' | 'dropoff' — controls marker shape (circle vs square)
// and whether the "use my location" arrow shows on the right.
function LocationField({ variant, value, onChange, onCoords, placeholder }) {
  const isPickup = variant === 'pickup'
  const [show, setShow] = useState(false)
  const [items, setItems] = useState(ADDRESS_SUGGESTIONS)
  const [focused, setFocused] = useState(false)
  const [geoLabel, setGeoLabel] = useState('Detecting location…')
  const [geoReady, setGeoReady] = useState(false)
  const geoCoordsRef = useRef(null)
  const timer = useRef(null)

  useEffect(() => {
    if (!isPickup) return
    if (!navigator.geolocation) { setGeoLabel('Location unavailable'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        geoCoordsRef.current = coords
        onCoords?.(coords)
        setGeoLabel(`Current location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`)
        setGeoReady(true)
        reverseGeocode(coords).then((label) => {
          if (label) setGeoLabel(label)
        })
      },
      () => setGeoLabel('Location unavailable'),
    )
  }, [isPickup, onCoords])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const controller = new AbortController()
    timer.current = setTimeout(() => {
      fetchLagosSuggestions(value, controller.signal).then((nextItems) => {
        if (!controller.signal.aborted) setItems(nextItems)
      })
    }, 300)
    return () => {
      controller.abort()
      if (timer.current) clearTimeout(timer.current)
    }
  }, [value])

  function useMyLocation() {
    if (!geoReady) return
    onCoords?.(geoCoordsRef.current)
    onChange(geoLabel)
    setShow(false)
  }

  function selectSuggestion(item) {
    onChange(item.label)
    onCoords?.(item.coords)
    setShow(false)
  }

  return (
    <div className={`relative ${show ? 'z-30' : 'z-0'}`} style={{ overflow: 'visible' }}>
      <div
        className={[
          'flex items-center gap-3 rounded-xl border bg-slate-100 px-4 py-3.5 transition-colors duration-150',
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { setFocused(true); setShow(true) }}
          onBlur={() => { setFocused(false); setTimeout(() => setShow(false), 150) }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        />

        {value ? (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange('') }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200"
            aria-label={`Clear ${isPickup ? 'pickup' : 'dropoff'}`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : isPickup ? (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); useMyLocation() }}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-900 disabled:text-slate-300"
            disabled={!geoReady}
            aria-label="Use current location"
          >
            <Navigation className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {show && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[1000] max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          {geoReady && isPickup && (
            <button
              type="button"
              onClick={() => useMyLocation()}
              className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-emerald-50"
            >
              <Navigation className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className="truncate text-sm font-medium text-emerald-700">{geoLabel}</span>
            </button>
          )}
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No results</p>
          ) : (
            items.map((it) => (
              <button
                key={it.label}
                type="button"
                onClick={() => selectSuggestion(it)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                <span className="truncate">{it.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Ride() {
  const user = useRequireAuth('customer')
  const navigate = useNavigate()
  const location = useLocation()
  const intent = location.state || {}

  const [option, setOption] = useState(null)
  const [pickup, setPickup] = useState(intent.pickup || '')
  const [dropoff, setDropoff] = useState(intent.dropoff || '')
  const [pickupCoords, setPickupCoords] = useState(intent.pickupCoords || null)
  const [dropoffCoords, setDropoffCoords] = useState(intent.dropoffCoords || null)
  const [ridePick, setRidePick] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchingRideId, setSearchingRideId] = useState(null)
  const [matchedRider, setMatchedRider] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [timedOut, setTimedOut] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(null) // 'cash' | 'transfer'
  const [customPrices, setCustomPrices] = useState({}) // { optionId: price }
  const [searchCountdown, setSearchCountdown] = useState(SEARCH_COUNTDOWN_MS / 1000)

  const store = useStore((s) => s)

  // How much of the screen a mobile bottom sheet is currently occupying
  // (real measured px, reported by MobileDrawer / RiderSearchDrawer). The
  // mobile map's container is pushed up by exactly this much so a drawer
  // can never sit on top of the pickup/dropoff markers.
  const [sheetOffsetPx, setSheetOffsetPx] = useState(0)
  const [sheetDragging, setSheetDragging] = useState(false)
  const handleSheetHeightChange = useCallback((px, dragging = true) => {
    setSheetOffsetPx(px)
    setSheetDragging(Boolean(dragging))
  }, [])

  // Calculate dynamic prices based on distance
  const distanceKm = useMemo(() => {
    if (!pickupCoords || !dropoffCoords) return 0
    return haversineKm(pickupCoords, dropoffCoords)
  }, [pickupCoords, dropoffCoords])

  const dynamicPrices = useMemo(() => {
    const prices = {}
    RIDE_OPTIONS.forEach((opt) => {
      const baseDistancePrice = opt.pricePerKm * Math.max(1, Math.ceil(distanceKm))
      const calculatedPrice = Math.round(opt.basePrice + baseDistancePrice)
      prices[opt.id] = Math.min(Math.max(calculatedPrice, opt.minPrice), opt.maxPrice)
    })
    return prices
  }, [distanceKm])

  // Countdown timer for rider search
  useEffect(() => {
    if (!searchingRideId || timedOut || matchedRider) {
      setSearchCountdown(SEARCH_COUNTDOWN_MS / 1000)
      return
    }

    const timer = setInterval(() => {
      setSearchCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [searchingRideId, timedOut, matchedRider])

  // Live, in-progress ride for this customer — drives the live map.
const [activeRide, setActiveRide] = useState(null)

  const liveCourier = activeRide?.courierPosition || null
  const livePickup = pickupCoords
  const liveDropoff = dropoffCoords
const liveRider = activeRide?.rider || null
 const liveCourierInfo = activeRide
  ? {
      riderName:
        activeRide.rider?.name ||
        activeRide.riderName ||
        'Driver en route',

      rideType:
        activeRide.rideType,

      plateNumber:
        activeRide.rider?.plateNumber,

      phone:
        activeRide.rider?.phone,
    }
  : null
useEffect(() => {
  if (!searchingRideId) return

  let cancelled = false
  let pollTimer
  let timeoutTimer

  const findRider = async () => {
    if (cancelled) return

    try {
      const ride = await assignAvailableRider(searchingRideId)

      if (ride?.rider) {
        if (cancelled) return

        setActiveRide(ride)
        setMatchedRider(ride)
        setSearchingRideId(null)
        setTimedOut(false)

        return
      }
    } catch (error) {
      /*
       * 404 simply means no rider is available yet.
       * Keep searching.
       */
      if (error.status !== 404) {
        console.error(
          'Rider assignment failed:',
          error
        )
      }
    }

    pollTimer = window.setTimeout(
      findRider,
      3000
    )
  }

  // Start the initial search after a short delay
  const startTimer =
    window.setTimeout(
      findRider,
      3000
    )

  // Set timeout timer for 20 seconds
  timeoutTimer = window.setTimeout(() => {
    if (!cancelled && searchingRideId) {
      setTimedOut(true)
      // Update the delivery in store with timedOut flag
      const delivery = store.deliveries.find((d) => d.id === searchingRideId)
      if (delivery) {
        store.deliveries = store.deliveries.map((d) => 
          d.id === searchingRideId ? { ...d, timedOut: true } : d
        )
        store.emit()
      }
    }
  }, SEARCH_TIMEOUT_MS)

  return () => {
    cancelled = true
    window.clearTimeout(startTimer)
    window.clearTimeout(pollTimer)
    window.clearTimeout(timeoutTimer)
  }
}, [searchingRideId])
  // Keep the map markers in sync with whatever the user types.
  const t1 = useRef(null)
  useEffect(() => {
    if (t1.current) clearTimeout(t1.current)
    if (pickup.trim().length < 3) return
    t1.current = setTimeout(() => {
      geocode(pickup).then((c) => c && setPickupCoords(resolveAddressCoords(pickup, c)))
    }, 400)
    return () => t1.current && clearTimeout(t1.current)
  }, [pickup])

  const t2 = useRef(null)
  useEffect(() => {
    if (t2.current) clearTimeout(t2.current)
    if (dropoff.trim().length < 3) { setDropoffCoords(null); return }
    t2.current = setTimeout(() => {
      geocode(dropoff).then((c) => c && setDropoffCoords(resolveAddressCoords(dropoff, c)))
    }, 400)
    return () => t2.current && clearTimeout(t2.current)
  }, [dropoff])

  if (!user) return null

async function confirmRide() {
  if (!option) return
  if (!paymentMethod) {
    setErrorMessage('Please select a payment method')
    return
  }

  setLoading(true)
  setIsSearching(true)
  setErrorMessage('')

  try {
    
    const customPrice = customPrices[option.id]
    
    const ride = await createRide({
      pickup: {
        address:
          pickup || 'My location',

        coords:
          pickupCoords || LAGOS,
      },

      dropoff: {
        address: dropoff,

        coords:
          dropoffCoords || LAGOS,
      },

      rideType: option.id,
      paymentMethod,
      customPrice,
    })

    setActiveRide(ride)

    setShowModal(false)
    setRidePick(false)

    setSearchingRideId(
      ride._id || ride.id
    )
  }
   catch (error) {
    console.error(
      'Failed to create ride:',
      error )

    setErrorMessage(getErrorMessage(error, 'Unable to create ride. Please check your pickup and destination.'))
  } finally {
    setLoading(false)
    setIsSearching(false)
  }
}
async function cancelRiderSearch() {
  const rideId =
    searchingRideId ||
    matchedRider?._id ||
    matchedRider?.id

  if (rideId) {
    try {
      const ride = await updateDeliveryStatus(rideId, 'cancelled')
      setActiveRide(ride || null)
    } catch (error) {
      console.error('Failed to cancel ride:', error)
      setErrorMessage(getErrorMessage(error, 'Unable to cancel ride search.'))
    }
  }

  setSearchingRideId(null)
  setMatchedRider(null)
  setTimedOut(false)
  setIsSearching(false)
}

function handleRetrySearch() {
  setTimedOut(false)
  setIsSearching(true)
  // Restart the search by re-setting the searchingRideId
  // We need to re-create the ride or restart the search
  if (matchedRider?._id || matchedRider?.id) {
    setSearchingRideId(matchedRider._id || matchedRider.id)
  }
}

function confirmMatchedRide() {
    if (!matchedRider) return
    navigate(`/customer/track/${matchedRider.id || matchedRider._id}`)
    setMatchedRider(null)
  }

  const getPriceForOption = (optionId) => {
    const customPrice = customPrices[optionId]
    if (customPrice) return customPrice
    return dynamicPrices[optionId] || RIDE_OPTIONS.find(o => o.id === optionId)?.basePrice || 0
  }

  const handlePriceChange = (optionId, delta) => {
    const optionData = RIDE_OPTIONS.find(o => o.id === optionId)
    if (!optionData) return
    
    const currentPrice = getPriceForOption(optionId)
    const newPrice = Math.min(Math.max(currentPrice + delta * 100, optionData.minPrice), optionData.maxPrice)
    setCustomPrices(prev => ({ ...prev, [optionId]: newPrice }))
  }

  const rideOptions = (
    <div className="space-y-3">
      {RIDE_OPTIONS.map((item) => {
        const currentPrice = getPriceForOption(item.id)
        const isSelected = option?.id === item.id
        return (
          <button
            key={item.id}
            onClick={() => setOption(item)}
            className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
              isSelected ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl"><img src={item.href} className="h-full w-full" alt="" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{item.name}</span>
              <span className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {item.eta} min</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {item.seats}</span>
              </span>
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-3 py-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePriceChange(item.id, -1) }}
                  disabled={currentPrice <= item.minPrice}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition"
                  aria-label="Decrease price"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-16 text-center font-bold text-slate-900">₦{currentPrice.toLocaleString()}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePriceChange(item.id, 1) }}
                  disabled={currentPrice >= item.maxPrice}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition"
                  aria-label="Increase price"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {isSelected && <Check className="mt-1 h-4 w-4 text-emerald-600" />}
            </div>
          </button>
        )
      })}
    </div>
  )

  return (
    <AppShell hideMobileHeader>
      <main className="mx-auto flex flex-col gap-6 px-4 py-6 lg:mt-4 md:mt-4 sm:px-6 lg:grid lg:grid-cols-2 ">
        {/* Left: route form */}
        <section className="overflow-visible rounded-3xl md:px-3 sm:p-8">
          <div className="max-w-lg">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Ride with Swifty</p>
            <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Where are you going?</h1>
          </div>

          <div className="relative z-20 mt-8 overflow-visible rounded-2xl bg-white p-4 shadow-sm" style={{ overflow: 'visible' }}>
            <div className="relative space-y-6" style={{ overflow: 'visible' }}>
              {/* Dashed connector: bottom of pickup marker to top of dropoff marker */}
              <div className="pointer-events-none absolute left-[27px] top-[52px] h-6 w-px border-l-2 border-dashed border-slate-300" />
              <LocationField variant="pickup" value={pickup} onChange={setPickup} onCoords={setPickupCoords} placeholder="Pickup location" />
              <LocationField variant="dropoff" value={dropoff} onChange={setDropoff} onCoords={setDropoffCoords} placeholder="Dropoff destination" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setErrorMessage(''); setShowModal(true); setRidePick(true) }}
            disabled={!dropoff.trim()}
            className="flex items-center gap-2 mt-4 rounded-xl bg-emerald-600 py-2.5 px-6 text-sm font-bold text-white shadow-lg shadow-sm transition hover:bg-emerald-400 disabled:opacity-50"
          >
            See prices
            <ArrowRight className="h-4 w-4" />
          </button>
          {errorMessage && (
            <p className="mt-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </p>
          )}
        </section>

        {/* Right: live map, fixed height like Book.jsx */}
        <section className="relative order-last hidden h-[38vh] min-h-[280px] overflow-hidden rounded-3xl border border-slate-200 lg:order-none lg:block lg:h-[560px]">
          {activeRide && (
            <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live · {activeRide.id}
            </div>
          )}
          <DeliveryMap
            pickup={activeRide ? livePickup : pickupCoords}
            dropoff={activeRide ? liveDropoff : dropoffCoords}
            courier={liveCourier}
            courierInfo={liveCourierInfo}
            destination={activeRide ? activeRide.dropoff.coords : dropoffCoords}
            className="h-full w-full"
          />
        </section>
      </main>

      {/* Mobile confirmation: a single persistent map, pushed up by whichever
          sheet is currently open, so pickup/dropoff markers stay visible
          and never end up hidden behind the sheet. */}
      {(showModal || searchingRideId || matchedRider) && (
        <>
          <div
            className={`fixed inset-x-0 top-0 z-100 lg:hidden ${sheetDragging ? '' : 'transition-[bottom] duration-200 ease-out'}`}
            style={{ bottom: sheetOffsetPx }}
          >
             
          <DeliveryMap
            pickup={activeRide ? livePickup : pickupCoords}
            dropoff={activeRide ? liveDropoff : dropoffCoords}
            courier={liveCourier}
            courierInfo={liveCourierInfo}
            destination={activeRide ? activeRide.dropoff.coords : dropoffCoords}
            className="h-full w-full"
          />
          </div>

          {ridePick && (
            <MobileDrawer
              onHeightChange={handleSheetHeightChange}
              footer={(
                <button
                  onClick={() => { setRidePick(false); confirmRide() }}
                  disabled={loading || !option || !paymentMethod}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {loading ? 'Starting search…' : 'Find a rider'} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-black text-slate-950">Choose your ride</h2>
                  <p className="mt-1 text-sm text-slate-500">{pickup || 'My location'} → {dropoff}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {errorMessage && (
                <p className="mb-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                  {errorMessage}
                </p>
              )}
              {/* Payment Method Selection */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Payment Method</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-3 transition ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Wallet className="h-5 w-5 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-3 transition ${
                      paymentMethod === 'transfer'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Transfer</span>
                  </button>
                </div>
                {!paymentMethod && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Select payment option
                  </p>
                )}
              </div>
              {rideOptions}
            </MobileDrawer>
          )}

          {/* Desktop confirmation remains a centered modal. */}
          {ridePick && (
            <div className="fixed inset-0 z-50 hidden items-end justify-center bg-slate-900/50 p-4 sm:items-center lg:flex">
              <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl font-black text-slate-950">Choose your ride</h2>
                  <button onClick={() => setRidePick(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mb-4 text-sm text-slate-500">{pickup || 'My location'} → {dropoff}</p>
                {errorMessage && (
                  <p className="mb-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                    {errorMessage}
                  </p>
                )}
                {/* Payment Method Selection */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Payment Method</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-3 transition ${
                        paymentMethod === 'cash'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Wallet className="h-5 w-5 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-700">Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-3 transition ${
                        paymentMethod === 'transfer'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="h-5 w-5 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-700">Transfer</span>
                    </button>
                  </div>
                  {!paymentMethod && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Select payment option
                    </p>
                  )}
                </div>
                {rideOptions}
                <button
                  onClick={() => { setRidePick(false); confirmRide() }}
                  disabled={loading || !option || !paymentMethod}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {loading ? 'Starting search…' : 'Find a rider'} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {(searchingRideId || matchedRider || isSearching) && (
        <RiderSearchDrawer
          rider={matchedRider ? liveRider || { name: matchedRider.riderName } : null}
          onCancel={cancelRiderSearch}
          onConfirm={confirmMatchedRide}
          onHeightChange={handleSheetHeightChange}
          onRetry={handleRetrySearch}
          timedOut={timedOut}
          countdown={searchCountdown}
        />
      )}
    </AppShell>
  )
}
