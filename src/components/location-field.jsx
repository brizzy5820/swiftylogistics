import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, X } from 'lucide-react'
import {
  fetchLagosSuggestions,
  fetchInitialLocationSuggestions,
  getManualSuggestionsByLocation,
  reverseGeocodeDetails,
} from '../lib/address-suggestions'

const UNAVAILABLE = 'Location unavailable'

// The one address field used by every booking surface (marketing site, ride,
// schedule). Each page used to carry its own copy, which is how they drifted:
// some had no geolocation at all, some offered the "use my location" arrow
// before a fix was available, and none of them agreed on what to show when the
// device has no location to give.
//
// Behaviour, identical everywhere:
//   • pickup field detects the device location once, then reverse-geocodes it
//     to a real street label (plus its LGA, so suggestions can be ranked by
//     proximity instead of alphabetically);
//   • suggestions are seeded nearest-first and re-queried as the user types,
//     passing the detected location through for the same ranking;
//   • the location arrow fills the field with the detected address and is
//     disabled until a fix (or a failure) has actually arrived;
//   • when there is no location to be had, the field says so — "Location
//     unavailable" — instead of silently offering an empty arrow.
export function LocationField({
  variant = 'pickup',
  label,
  value,
  onChange,
  onCoords,
  placeholder = 'Type an address',
  userCoords,
  userLga,
  onUserLocationDetected,
  onClear,
  debounceMs = 250,
  autoFocus,
  inputRef,
}) {
  const isPickup = variant === 'pickup'
  const [show, setShow] = useState(false)
  const [items, setItems] = useState(() => getManualSuggestionsByLocation(userCoords, userLga))
  const [focused, setFocused] = useState(false)
  const [geoLabel, setGeoLabel] = useState('Locating your street…')
  const [geoReady, setGeoReady] = useState(false)
  const geoCoordsRef = useRef(userCoords || null)
  const geoLgaRef = useRef(userLga || null)
  const timer = useRef(null)

  useEffect(() => {
    if (userCoords) geoCoordsRef.current = userCoords
    if (userLga) geoLgaRef.current = userLga
  }, [userCoords, userLga])

  // Only the pickup field asks for a fix — a dropoff is never "where I am".
  useEffect(() => {
    if (!isPickup) return

    if (!navigator.geolocation) {
      setGeoLabel(UNAVAILABLE)
      setGeoReady(true)
      return
    }

    let cancelled = false
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        geoCoordsRef.current = coords
        onCoords?.(coords)
        setGeoLabel('Detecting exact street…')

        let details = null
        try {
          details = await reverseGeocodeDetails(coords)
        } catch {
          details = null
        }
        if (cancelled) return

        if (details?.label) {
          setGeoLabel(details.label)
          geoLgaRef.current = details.lga || null
          onUserLocationDetected?.({ coords, details })
          // Seed the list with what is actually around the user, nearest first,
          // instead of the flat alphabetical fallback.
          fetchInitialLocationSuggestions(coords, details.lga).then((initialList) => {
            if (!cancelled && initialList && initialList.length > 0) setItems(initialList)
          })
        } else {
          // We have coordinates but no street name for them: still usable, so
          // do not claim the location is unavailable.
          setGeoLabel('Current street location')
        }
        setGeoReady(true)
      },
      () => {
        if (cancelled) return
        setGeoLabel(UNAVAILABLE)
        setGeoReady(true)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )

    return () => {
      cancelled = true
    }
  }, [isPickup, onCoords, onUserLocationDetected])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const controller = new AbortController()
    timer.current = setTimeout(() => {
      fetchLagosSuggestions(
        value,
        { userCoords: geoCoordsRef.current || userCoords, userLga: geoLgaRef.current || userLga },
        controller.signal,
      ).then((nextItems) => {
        if (!controller.signal.aborted && nextItems) setItems(nextItems)
      })
    }, debounceMs)
    return () => {
      controller.abort()
      if (timer.current) clearTimeout(timer.current)
    }
  }, [value, userCoords, userLga, debounceMs])

  function applyCurrentLocation() {
    if (!geoReady || !geoCoordsRef.current) return
    onCoords?.(geoCoordsRef.current)
    onChange(geoLabel === UNAVAILABLE ? value : geoLabel)
    setShow(false)
  }

  function selectSuggestion(item) {
    onChange(item.label)
    onCoords?.(item.coords)
    setShow(false)
  }

  const clearValue = () => {
    onChange('')
    onClear?.()
  }

  return (
    <div className={`relative ${show ? 'z-30' : 'z-0'}`} style={{ overflow: 'visible' }}>
      {label && (
        <p className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      )}

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
          ref={inputRef}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setFocused(true)
            setShow(true)
          }}
          onBlur={() => {
            setFocused(false)
            setTimeout(() => setShow(false), 150)
          }}
          placeholder={placeholder}
          aria-label={label || placeholder}
          className="w-full min-w-0 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        />

        {value ? (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              clearValue()
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200"
            aria-label={`Clear ${isPickup ? 'pickup' : 'dropoff'}`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : isPickup ? (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              applyCurrentLocation()
            }}
            disabled={!geoReady || !geoCoordsRef.current}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-900 disabled:text-slate-300"
            aria-label="Use current location"
            title={geoReady ? 'Use current location' : 'Locating you…'}
          >
            <Navigation className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {show && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[1000] max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          {isPickup && (
            <button
              type="button"
              onClick={applyCurrentLocation}
              disabled={!geoReady || !geoCoordsRef.current}
              className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Navigation className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className={`truncate text-sm font-medium ${geoLabel === UNAVAILABLE ? 'text-slate-400' : 'text-emerald-700'}`}>
                {geoLabel}
              </span>
            </button>
          )}

          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No results</p>
          ) : (
            items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => selectSuggestion(item)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                <span className="truncate">{item.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
