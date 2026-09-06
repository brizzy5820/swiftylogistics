import { useEffect, useRef, useState } from 'react'

export const API_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY

export function loadGoogleMaps(key) {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.maps) return Promise.resolve()
  return new Promise((resolve, reject) => {
    if (document.getElementById('gmaps-script')) {
      const iv = setInterval(() => {
        if (window.google?.maps) { clearInterval(iv); resolve() }
      }, 80)
      return
    }
    const s = document.createElement('script')
    s.id = 'gmaps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`
    s.async = true
    s.defer = true
    s.onload = resolve
    s.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(s)
  })
}

function pinSvgUrl(fillColor, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 9.6 16 26 16 26S32 25.6 32 16C32 7.2 24.8 0 16 0z" fill="${fillColor}"/>
    <circle cx="16" cy="16" r="9" fill="white"/>
    <text x="16" y="20" text-anchor="middle" font-size="11" font-weight="800" fill="${fillColor}">${label}</text>
  </svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

function courierSvgUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
    <circle cx="13" cy="13" r="13" fill="rgba(16,185,129,0.28)"/>
    <circle cx="13" cy="13" r="8" fill="#10B981" stroke="white" stroke-width="2.5"/>
  </svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

function animateTo(marker, toLat, toLng, duration = 1400) {
  const from = marker.getPosition()
  const sLat = from.lat()
  const sLng = from.lng()
  const t0 = performance.now()
  function tick(now) {
    const p = Math.min((now - t0) / duration, 1)
    marker.setPosition({ lat: sLat + (toLat - sLat) * p, lng: sLng + (toLng - sLng) * p })
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function haversineKm(a, b) {
  if (!a || !b) return 0
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

export function DeliveryMap({ pickup, dropoff, courier, courierInfo, destination, className, onMapClick }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const courierMarkerRef = useRef(null)
  const pickupMarkerRef = useRef(null)
  const dropoffMarkerRef = useRef(null)
  const routeRef = useRef(null)
  const infoWindowRef = useRef(null)
  const initializedRef = useRef(false)
  const onMapClickRef = useRef(onMapClick)
  const [error, setError] = useState(null)

  useEffect(() => { onMapClickRef.current = onMapClick }, [onMapClick])

  // ── Boot: create the map once ───────────────────────────────────────────
  useEffect(() => {
    if (!API_KEY) { setError('no-key'); return }
    let cancelled = false

    loadGoogleMaps(API_KEY)
      .then(() => {
        if (cancelled || !containerRef.current || initializedRef.current) return
        const G = window.google.maps
        const center = pickup ?? dropoff ?? { lat: 6.5244, lng: 3.3792 }

        const map = new G.Map(containerRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: 13,
          disableDefaultUI: false,
        })

        if (onMapClickRef.current) {
          map.addListener('click', (e) => onMapClickRef.current(e.latLng.lat(), e.latLng.lng()))
        }

        mapRef.current = map
        initializedRef.current = true
      })
      .catch((e) => setError(e.message))

    return () => {
      cancelled = true
      mapRef.current = null
      initializedRef.current = false
      courierMarkerRef.current = null
      pickupMarkerRef.current = null
      dropoffMarkerRef.current = null
      routeRef.current = null
      infoWindowRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Static layer: pickup + dropoff + route (re-draws when they change) ──
  useEffect(() => {
    if (!mapRef.current || !initializedRef.current) return
    const G = window.google.maps
    const map = mapRef.current

    pickupMarkerRef.current?.setMap(null)
    dropoffMarkerRef.current?.setMap(null)
    routeRef.current?.setMap(null)
    pickupMarkerRef.current = null
    dropoffMarkerRef.current = null
    routeRef.current = null

    const bounds = new G.LatLngBounds()

    if (pickup) {
      pickupMarkerRef.current = new G.Marker({
        map,
        position: { lat: pickup.lat, lng: pickup.lng },
        icon: { url: pinSvgUrl('#2563EB', 'A'), scaledSize: new G.Size(32, 42), anchor: new G.Point(16, 42) },
        title: 'Pickup',
      })
      bounds.extend({ lat: pickup.lat, lng: pickup.lng })
    }

    if (dropoff) {
      dropoffMarkerRef.current = new G.Marker({
        map,
        position: { lat: dropoff.lat, lng: dropoff.lng },
        icon: { url: pinSvgUrl('#EF4444', 'B'), scaledSize: new G.Size(32, 42), anchor: new G.Point(16, 42) },
        title: 'Drop-off',
      })
      bounds.extend({ lat: dropoff.lat, lng: dropoff.lng })
    }

    if (pickup && dropoff) {
      routeRef.current = new G.Polyline({
        map,
        path: [{ lat: pickup.lat, lng: pickup.lng }, { lat: dropoff.lat, lng: dropoff.lng }],
        strokeColor: '#2563EB',
        strokeOpacity: 0,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeWeight: 4, scale: 4 },
          offset: '0',
          repeat: '20px',
        }],
      })
      map.fitBounds(bounds, 64)
    } else if (pickup) {
      map.setCenter({ lat: pickup.lat, lng: pickup.lng })
      map.setZoom(14)
    } else if (dropoff) {
      map.setCenter({ lat: dropoff.lat, lng: dropoff.lng })
      map.setZoom(14)
    }
  }, [pickup, dropoff])

  // ── Live: smooth courier marker updates ──────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !initializedRef.current) return
    const G = window.google.maps
    const map = mapRef.current

    if (!courier) {
      courierMarkerRef.current?.setMap(null)
      courierMarkerRef.current = null
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
      }
      return
    }

    if (!courierMarkerRef.current) {
      courierMarkerRef.current = new G.Marker({
        map,
        position: { lat: courier.lat, lng: courier.lng },
        icon: { url: courierSvgUrl(), scaledSize: new G.Size(26, 26), anchor: new G.Point(13, 13) },
        title: 'Courier',
        zIndex: 10,
      })
    } else {
      animateTo(courierMarkerRef.current, courier.lat, courier.lng)
    }

    // Info window: click on the rider marker shows rider details + km left
    if (!infoWindowRef.current) infoWindowRef.current = new G.InfoWindow()
    const target = destination || dropoff
    const kmLeft = target ? Math.round(haversineKm(courier, target) * 10) / 10 : null
    const riderName = courierInfo?.riderName || 'Driver en route'
    const riderVehicle = courierInfo?.vehicleType || courierInfo?.rideType || ''
    const riderPlate = courierInfo?.plateNumber || ''
    const riderPhone = courierInfo?.phone || ''
    const content = `
      <div style="font-family:system-ui;font-size:12px;min-width:180px;padding:4px 2px">
        <p style="margin:0;font-weight:800;color:#0f172a">${riderName}</p>
        ${riderVehicle ? `<p style="margin:2px 0 0;color:#64748b">${riderVehicle}${riderPlate ? ' · ' + riderPlate : ''}</p>` : ''}
        ${kmLeft != null ? `<p style="margin:6px 0 0;font-weight:700;color:#10B981">${kmLeft} km to arrival</p>` : ''}
        ${riderPhone ? `<p style="margin:2px 0 0;color:#64748b">${riderPhone}</p>` : ''}
      </div>`
    courierMarkerRef.current.addListener('click', () => {
      infoWindowRef.current.setContent(content)
      infoWindowRef.current.open(map, courierMarkerRef.current)
    })

    const bounds = map.getBounds()
    if (bounds && !bounds.contains({ lat: courier.lat, lng: courier.lng })) {
      map.panTo({ lat: courier.lat, lng: courier.lng })
    }
  }, [courier, courierInfo, destination, dropoff])

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div ref={containerRef} className="absolute inset-0 lg:rounded-2xl overflow-hidden bg-surface-200" />
      {error === 'no-key' && (
        <div className="absolute inset-0 grid place-items-center bg-surface-200 rounded-2xl">
          <p className="text-sm text-slate-500">Add <code>VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY</code> to <code>.env</code></p>
        </div>
      )}
      {error && error !== 'no-key' && (
        <div className="absolute inset-0 grid place-items-center bg-surface-200 rounded-2xl">
          <p className="text-sm text-slate-500">Map unavailable</p>
        </div>
      )}
    </div>
  )
}