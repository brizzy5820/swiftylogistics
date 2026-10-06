// pages/customer/ride.jsx (or wherever Ride.jsx lives)
import { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { ArrowLeft, CarFront, Check, Navigation, Users,User, Clock3, X, ArrowRight, Radio, MapPin, LoaderCircle, RefreshCw, Plus, Minus, Wallet, CreditCard, ChevronLeftIcon } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AppShell } from '../../components/app-shell'
import { DeliveryMap } from '../../components/delivery-map'
import { MobileRouteMap } from '../../components/mobile-route-map'
import { MobileDrawer } from '../../components/mobile-drawer'
import { RiderSearchDrawer, SEARCH_COUNTDOWN_MS } from '../../components/rider-search-drawer'
import { LocationField } from '../../components/location-field'
import { useRequireAuth } from '../../lib/use-require-auth'
import { assignAvailableRider, createRide, updateDeliveryStatus, useStore, emit, getStore } from '../../lib/api-store'
import { getErrorMessage } from '../../services/api'
import { RIDE_OPTIONS } from '../../data/app-data'
import { fetchLagosSuggestions, resolveAddressCoords } from '../../lib/address-suggestions'
import { haversineKm } from '../../components/delivery-map'
import { useSimulatedCourierPosition } from '../../lib/use-simulated-courier'


const LAGOS = { lat: 6.5244, lng: 3.3792 }

const SEARCH_TIMEOUT_MS = 60000

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


export default function Ride() {
  const user = useRequireAuth('customer')
  const navigate = useNavigate()
  const location = useLocation()
  const intent = location.state || {}
const [bidOpen, setBidOpen] = useState({})
  const [option, setOption] = useState(null)
  const [pickup, setPickup] = useState(intent.pickup || '')
  const [dropoff, setDropoff] = useState(intent.dropoff || '')
  const [pickupCoords, setPickupCoords] = useState(intent.pickupCoords || null)
  const [dropoffCoords, setDropoffCoords] = useState(intent.dropoffCoords || null)
  const [userLocation, setUserLocation] = useState(null)
  const [ridePick, setRidePick] = useState(false)
  const [paymentStep, setPaymentStep] = useState(false)
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
  // The ride we are hunting a rider for. Kept in a ref so "Try again" can
  // restart the search even when no rider ever matched (matchedRider is null
  // in exactly the timed-out case, which is the only case retry is shown in).
  const searchingRideRef = useRef(null)
  // Bumped to restart the polling effect without changing the ride id.
  const [searchAttempt, setSearchAttempt] = useState(0)
const handleBidToggle = (id) => {
  setBidOpen((prev) => ({
    ...prev,
    [id]: !prev[id],
  
  }))
}
  const store = useStore((s) => s)

  // Exactly one bottom sheet can own the screen at a time. Every sheet reports
  // its measured height so the map behind it can be pushed up by exactly that
  // much; without a single owner the previous sheet's "I'm gone" report (0)
  // races the new sheet's first report and the map ends up at the wrong height
  // — the route then renders underneath the drawer instead of above it.
  const sheetOwner =
    searchingRideId || matchedRider ? 'search' : paymentStep ? 'payment' : ridePick ? 'pick' : null

  // How much of the screen a mobile bottom sheet is currently occupying
  // (real measured px, reported by MobileDrawer / RiderSearchDrawer). The
  // mobile map's container is pushed up by exactly this much so a drawer
  // can never sit on top of the pickup/dropoff markers.
  const [sheetOffsetPx, setSheetOffsetPx] = useState(0)
  const [sheetDragging, setSheetDragging] = useState(false)
  const applySheetHeight = useCallback((owner, px, dragging) => {
    if (owner !== sheetOwner) return
    setSheetOffsetPx(px)
    setSheetDragging(Boolean(dragging))
  }, [sheetOwner])
  const sheetHandlers = useMemo(() => ({
    pick: (px, dragging) => applySheetHeight('pick', px, dragging),
    payment: (px, dragging) => applySheetHeight('payment', px, dragging),
    search: (px, dragging) => applySheetHeight('search', px, dragging),
  }), [applySheetHeight])

  // No sheet open at all — drop the offset so the map fills the screen again.
  useEffect(() => {
    if (sheetOwner) return
    setSheetOffsetPx(0)
    setSheetDragging(false)
  }, [sheetOwner])

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

  const { position: liveCourier } = useSimulatedCourierPosition(activeRide)
  const livePickup = pickupCoords
  const liveDropoff = dropoffCoords
const liveRider = activeRide?.rider || null
 // Memoised on purpose: this object lands in DeliveryMap's courier effect deps,
 // so a fresh identity on every render re-triggers the car's glide + panTo and
 // the marker visibly stutters instead of travelling.
 const liveCourierInfo = useMemo(() => (
   activeRide
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
 ), [activeRide])
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
      const store = getStore()
      const delivery = store.deliveries.find((d) => d.id === searchingRideId)
      if (delivery) {
        store.deliveries = store.deliveries.map((d) => 
          d.id === searchingRideId ? { ...d, timedOut: true } : d
        )
        emit()
      }
    }
  }, SEARCH_TIMEOUT_MS)

  return () => {
    cancelled = true
    window.clearTimeout(startTimer)
    window.clearTimeout(pollTimer)
    window.clearTimeout(timeoutTimer)
  }
}, [searchingRideId, searchAttempt])
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
    setPaymentStep(false)

    const rideId = ride?._id || ride?.id
    if (!rideId) {
      setErrorMessage('This ride could not be started. Please try again.')
      return
    }

    searchingRideRef.current = rideId
    setSearchingRideId(rideId)
    setSearchAttempt((n) => n + 1)
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
    searchingRideRef.current ||
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

  searchingRideRef.current = null
  setSearchingRideId(null)
  setMatchedRider(null)
  setTimedOut(false)
  setIsSearching(false)
}

function handleRetrySearch() {
  const rideId = searchingRideRef.current || searchingRideId
  if (!rideId) return
  setTimedOut(false)
  setSearchingRideId(rideId)
  // Same id, fresh polling loop — without the attempt bump the effect above
  // would not re-run and "Try again" would do nothing at all.
  setSearchAttempt((n) => n + 1)
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
  <div className="w-full space-y-3">
    {RIDE_OPTIONS.map((item) => {
      const currentPrice = getPriceForOption(item.id)
      const isSelected = option?.id === item.id
      const isBidOpen = !!bidOpen[item.id]

      return (
        <div
          key={item.id}
          className={`w-full overflow-hidden rounded-2xl border transition ${
            isSelected
              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10'
              : 'border-slate-200 bg-white'
          }`}
        >
          {/* MAIN RIDE BAR */}
          <div
            onClick={(e) => {
              e.stopPropagation()
              handleBidToggle(item.id)
              setOption(item)
            }}
            className="flex w-full min-w-0 cursor-pointer items-center gap-2 p-3 transition sm:gap-4 sm:p-4"
          >
            {/* Vehicle */}
            <span className="flex h-11 w-12 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-14">
              <img
                src={item.href}
                className="h-full w-full object-contain"
                alt={item.name}
              />
            </span>

            {/* Ride details */}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-900">
                {item.name}
              </span>

              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3 w-3 shrink-0" />
                  {item.eta} min
                </span>

                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3 shrink-0" />
                  {item.seats}
                </span>
              </span>
            </span>

            {/* PRICE */}
            <span className="shrink-0 text-right">
              <span className="block whitespace-nowrap text-sm font-black text-slate-900">
                ₦{currentPrice.toLocaleString()}
              </span>
            </span>


            {/* SELECTED CHECK */}
            {isSelected && (
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
          </div>

          {/* BID CONTROLS */}
          {isBidOpen && (
            <div className="flex w-full items-center justify-center border-t border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-center gap-4">
                
                {/* MINUS */}
                <button
                  type="button"
                  onClick={() => handlePriceChange(item.id, -1)}
                  disabled={currentPrice <= item.minPrice}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Decrease price"
                >
                  <Minus className="h-4 w-4" />
                </button>

                {/* BID PRICE */}
                <div className="min-w-[100px] text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Your bid
                  </span>

                  <span className="block text-sm font-black text-slate-900">
                    ₦{currentPrice.toLocaleString()}
                  </span>
                </div>

                {/* PLUS */}
                <button
                  type="button"
                  onClick={() => handlePriceChange(item.id, 1)}
                  disabled={currentPrice >= item.maxPrice}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Increase price"
                >
                  <Plus className="h-4 w-4" />
                </button>

              </div>
            </div>
          )}
        </div>
      )
    })}
  </div>
)

  // The whole booking/search flow runs over ONE persistent map. Tearing it
  // down between steps (which is what gating on the individual step flags
  // does) destroys the Google map instance and forces a fresh Directions
  // request + fitBounds on the way back in — the route visibly vanishes and
  // snaps back. `flowActive` stays true from "See prices" until the search
  // card is dismissed, so the map simply gets pushed around instead.
  const flowActive = Boolean(
    sheetOwner || showModal || loading || isSearching,
  )

  return (
    <AppShell hideMobileHeader>
      <main className="mx-auto flex flex-col gap-6 px-4 py-4 lg:mt-4 md:mt-4 sm:px-6 lg:grid lg:grid-cols-2 ">
        {/* Left: route form */}
        <section className="overflow-visible rounded-3xl  sm:p-8">
           <div className="max-w-lg gap-3  flex items-center">
            {/* <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Ride with Swifty</p> */}
            <Link to="/customer" className='lg:hidden mt-2' ><ChevronLeftIcon className='w-6 h-6'/></Link>
            <h1 className="mt-2 font-display text-2xl font-black tracking-tight text-slate-950 sm:text-5xl">Where to?</h1>
           
          </div>


          <div className="relative z-20 mt-2 overflow-visible rounded-2xl bg-white p-4 lg:shadow-sm" style={{ overflow: 'visible' }}>
            <div className="relative space-y-6" style={{ overflow: 'visible' }}>
              {/* Dashed connector: bottom of pickup marker to top of dropoff marker */}
              <div className="pointer-events-none absolute left-[27px] top-[52px] h-6 w-px border-l-2 border-dashed border-slate-300" />
              <LocationField
                variant="pickup"
                value={pickup}
                onChange={setPickup}
                onCoords={setPickupCoords}
                placeholder="Pickup location"
                userCoords={pickupCoords || userLocation?.coords}
                userLga={userLocation?.details?.lga}
                onUserLocationDetected={setUserLocation}
              />
              <LocationField
                variant="dropoff"
                value={dropoff}
                onChange={setDropoff}
                onCoords={setDropoffCoords}
                placeholder="Dropoff destination"
                userCoords={pickupCoords || userLocation?.coords}
                userLga={userLocation?.details?.lga}
              />
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
            pickupAddress={activeRide ? activeRide.pickup?.address : pickup}
            dropoffAddress={activeRide ? activeRide.dropoff?.address : dropoff}
            className="h-full w-full"
          />
        </section>
      </main>

      {!flowActive && (
        <MobileRouteMap
          pickup={activeRide ? livePickup : pickupCoords}
          dropoff={activeRide ? liveDropoff : dropoffCoords}
          courier={liveCourier}
          courierInfo={liveCourierInfo}
          destination={activeRide ? activeRide.dropoff.coords : dropoffCoords}
          pickupAddress={activeRide ? activeRide.pickup?.address : pickup}
          dropoffAddress={activeRide ? activeRide.dropoff?.address : dropoff}
          activeLabel={activeRide ? `Live · ${activeRide.id}` : 'Route preview'}
          description={`${pickup || 'Pickup'} → ${dropoff || 'Dropoff'}`}
        />
      )}

      {/* Mobile confirmation: a single persistent map, pushed up by whichever
          sheet is currently open, so pickup/dropoff markers stay visible
          and never end up hidden behind the sheet. */}
      {(flowActive || searchingRideId || matchedRider) && (
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
            pickupAddress={activeRide ? activeRide.pickup?.address : pickup}
            dropoffAddress={activeRide ? activeRide.dropoff?.address : dropoff}
            className="h-full w-full"
          />
          </div>

          {ridePick && (
         <MobileDrawer
  onHeightChange={sheetHandlers.pick}
  footer={(
    <button
      onClick={() => {
        setRidePick(false)
        setShowModal(false)
        setErrorMessage('')
        setPaymentStep(true)
      }}
      disabled={loading || !option}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400 disabled:opacity-60"
    >
      Continue
      <ArrowRight className="h-4 w-4" />
    </button>
  )}
>
  <div className="w-full min-w-0">

    {/* HEADER */}
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-black text-slate-950">
          Choose your ride
        </h2>

        <p className="mt-1 break-words text-sm text-slate-500">
          {pickup || 'My location'} → {dropoff}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {setRidePick(false), setShowModal(false)}}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    {/* ERROR */}
    {errorMessage && (
      <p className="mb-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
        {errorMessage}
      </p>
    )}

    {/* RIDE OPTIONS */}
    {rideOptions}

  </div>
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
                {rideOptions}
                <button
                  onClick={() => { setRidePick(false); setShowModal(false); setErrorMessage(''); setPaymentStep(true) }}
                  disabled={loading || !option}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: payment method — its own screen, shown after a ride
              type has been picked and before the rider search begins. ── */}
          {paymentStep && (
            <MobileDrawer
              fitContent
              onHeightChange={sheetHandlers.payment}
              footer={(
                <button
                  onClick={() => confirmRide()}
                  disabled={loading || !paymentMethod}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {loading ? 'Starting search…' : 'Find a rider'} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => { setPaymentStep(false); setShowModal(true); setRidePick(true) }}
                  className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button onClick={() => setPaymentStep(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h2 className="font-display text-xl font-black text-slate-950">{option?.name || 'Your ride'} · ₦{option ? dynamicPrices[option.id] : 0}</h2>
              {errorMessage && (
                <p className="mt-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                  {errorMessage}
                </p>
              )}
              <div className="mt-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Choose Payment Method</p>
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
              </div>
            </MobileDrawer>
          )}

          {/* Desktop payment-method modal. */}
          {paymentStep && (
            <div className="fixed inset-0 z-50 hidden items-end justify-center bg-slate-900/50 p-4 sm:items-center lg:flex">
              <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    onClick={() => { setPaymentStep(false); setShowModal(true); setRidePick(true) }}
                    className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button onClick={() => setPaymentStep(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h2 className="font-display text-xl font-black text-slate-950">How will you pay?</h2>
                <p className="mt-1 text-sm text-slate-500">{option?.name || 'Your ride'} · ₦{option ? dynamicPrices[option.id] : 0}</p>
                {errorMessage && (
                  <p className="mt-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                    {errorMessage}
                  </p>
                )}
                <div className="mt-5">
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
                </div>
                <button
                  onClick={() => confirmRide()}
                  disabled={loading || !paymentMethod}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {loading ? 'Starting search…' : 'Find a rider'} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {(searchingRideId || matchedRider) && (
        <RiderSearchDrawer
          rider={matchedRider ? liveRider || { name: matchedRider.riderName } : null}
          onCancel={cancelRiderSearch}
          onConfirm={confirmMatchedRide}
          onHeightChange={sheetHandlers.search}
          onRetry={handleRetrySearch}
          timedOut={timedOut}
          countdown={searchCountdown}
        />
      )}
    </AppShell>
  )
}
