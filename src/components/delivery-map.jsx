import { useEffect, useRef, useState } from 'react'
import { SkeletonMap } from '@/components/ui/skeleton'
import { useDelayedLoading } from '@/lib/use-delayed-loading'

export const API_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY

// Brand route colour (Swifty emerald).
const ROUTE_COLOR = '#10B981'

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

// Character codes so the source never contains literal HTML entities that a
// formatter/transport layer might decode.
const AMP = String.fromCharCode(38)
const LT = String.fromCharCode(60)
const GT = String.fromCharCode(62)
const DQUOTE = String.fromCharCode(34)
const SQUOTE = String.fromCharCode(39)

function escapeHtml(value) {
  const s = String(value == null ? '' : value)
  return s
    .split(AMP).join(AMP + 'amp;')
    .split(LT).join(AMP + 'lt;')
    .split(GT).join(AMP + 'gt;')
    .split(DQUOTE).join(AMP + 'quot;')
    .split(SQUOTE).join(AMP + '#39;')
}

function pinSvgUrl(fillColor, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 9.6 16 26 16 26S32 25.6 32 16C32 7.2 24.8 0 16 0z" fill="${fillColor}"/>
    <circle cx="16" cy="16" r="9" fill="white"/>
    <text x="16" y="20" text-anchor="middle" font-size="11" font-weight="800" fill="${fillColor}">${label}</text>
  </svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

// Top-down car interface for the rider/courier. Base orientation points north
// (up), so a bearing of 0deg reads as "heading north".
function carSvg() {
  return `
    <div class="swifty-car">
      <span class="swifty-car__ring"></span>
      <svg class="swifty-car__icon" width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="7" y="2.6" width="10" height="18.8" rx="3.4" fill="${ROUTE_COLOR}"/>
        <rect x="8.7" y="5.6" width="6.6" height="3.6" rx="1.2" fill="#ECFDF5"/>
        <rect x="8.7" y="14.6" width="6.6" height="3.2" rx="1.2" fill="#ECFDF5"/>
        <rect x="4.8" y="6.4" width="2.1" height="3.4" rx="1" fill="#047857"/>
        <rect x="17.1" y="6.4" width="2.1" height="3.4" rx="1" fill="#047857"/>
        <rect x="4.8" y="14.2" width="2.1" height="3.4" rx="1" fill="#047857"/>
        <rect x="17.1" y="14.2" width="2.1" height="3.4" rx="1" fill="#047857"/>
      </svg>
    </div>`
}

// Google's OverlayView, wrapped so we can drop arbitrary, pixel-fixed DOM onto
// the map (address labels, the ETA chip and the car). Pins would distort on
// zoom; overlays keep a constant screen size and reposition on every draw().
function makeDomOverlay(G) {
  return class DomOverlay extends G.OverlayView {
    constructor({ position, className = '', html = '' }) {
      super()
      this.position = position
      this.className = className
      this.html = html
      this.div = null
    }

    onAdd() {
      const div = document.createElement('div')
      div.className = this.className
      div.innerHTML = this.html
      this.div = div
      const panes = this.getPanes()
      ;(panes.overlayLayer || panes.overlayMouseTarget || panes.floatPane).appendChild(div)
    }

    draw() {
      if (!this.div || !this.position) return
      const projection = this.getProjection()
      if (!projection) return
      const point = projection.fromLatLngToDivPixel(this.position)
      if (!point) return
      this.div.style.left = `${point.x}px`
      this.div.style.top = `${point.y}px`
    }

    onRemove() {
      if (this.div && this.div.parentNode) this.div.parentNode.removeChild(this.div)
      this.div = null
    }

    setPosition(position) {
      this.position = position
      this.draw()
    }

    setHtml(html) {
      this.html = html
      if (this.div) this.div.innerHTML = html
    }

    setRotation(deg) {
      if (this.div) this.div.style.setProperty('--car-rot', `${deg}deg`)
    }
  }
}

// Smoothly glide an overlay from `from` -> `to` (plain {lat,lng} objects).
function animateOverlay(G, overlay, from, to, duration = 1400) {
  const t0 = performance.now()
  function tick(now) {
    const p = Math.min((now - t0) / duration, 1)
    const lat = from.lat + (to.lat - from.lat) * p
    const lng = from.lng + (to.lng - from.lng) * p
    overlay.setPosition(new G.LatLng(lat, lng))
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// Compass bearing (degrees, 0 = north) from a -> b, used to point the car.
function bearingDegrees(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (r) => (r * 180) / Math.PI
  const dLon = toRad(b.lng - a.lng)
  const y = Math.sin(dLon) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export function haversineKm(a, b) {
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

export function DeliveryMap({
  pickup,
  dropoff,
  courier,
  courierInfo,
  destination,
  pickupAddress,
  dropoffAddress,
  className,
  onMapClick,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const carRef = useRef(null)
  const pickupMarkerRef = useRef(null)
  const dropoffMarkerRef = useRef(null)
  const casingRef = useRef(null)
  const routeRef = useRef(null)
  const pickupLabelRef = useRef(null)
  const dropoffLabelRef = useRef(null)
  const chipRef = useRef(null)
  const infoWindowRef = useRef(null)
  const initializedRef = useRef(false)
  const domOverlayClassRef = useRef(null)
  const directionsRef = useRef(null)
  const routeRequestRef = useRef(0)
  const routeBoundsRef = useRef(null)
  const carInfoRef = useRef(null)
  const onMapClickRef = useRef(onMapClick)

  // Always-fresh snapshots read from the resize observer below.
  const pickupRef = useRef(pickup)
  const dropoffRef = useRef(dropoff)

  const [error, setError] = useState(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => { onMapClickRef.current = onMapClick }, [onMapClick])
  useEffect(() => { pickupRef.current = pickup }, [pickup])
  useEffect(() => { dropoffRef.current = dropoff }, [dropoff])

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

        domOverlayClassRef.current = makeDomOverlay(G)
        mapRef.current = map
        initializedRef.current = true
        setMapReady(true)
      })
      .catch((e) => setError(e.message))

    return () => {
      cancelled = true
      mapRef.current = null
      initializedRef.current = false
      setMapReady(false)
      carRef.current = null
      pickupMarkerRef.current = null
      dropoffMarkerRef.current = null
      casingRef.current = null
      routeRef.current = null
      pickupLabelRef.current = null
      dropoffLabelRef.current = null
      chipRef.current = null
      infoWindowRef.current = null
      routeBoundsRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Container resize: Google Maps does NOT auto-detect its container
  // resizing. Whenever the wrapping box changes size (most commonly on mobile
  // when a bottom sheet grows/shrinks) the cached dimensions go stale, so we
  // force a remeasure and re-fit to keep everything correctly framed.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let frame = null

    const observer = new ResizeObserver(() => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (!mapRef.current || !initializedRef.current) return
        const G = window.google.maps
        const map = mapRef.current
        G.event.trigger(map, 'resize')

        if (routeBoundsRef.current) {
          map.fitBounds(routeBoundsRef.current, { top: 72, right: 56, bottom: 72, left: 56 })
          return
        }

        const p = pickupRef.current
        const d = dropoffRef.current
        if (p && d) {
          const bounds = new G.LatLngBounds()
          bounds.extend({ lat: p.lat, lng: p.lng })
          bounds.extend({ lat: d.lat, lng: d.lng })
          map.fitBounds(bounds, 72)
        } else if (p) {
          map.setCenter({ lat: p.lat, lng: p.lng })
        } else if (d) {
          map.setCenter({ lat: d.lat, lng: d.lng })
        }
      })
    })

    observer.observe(el)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  // ── Static layer: pickup + dropoff pins, address labels and the real
  // road-routed trace with a centred ETA/distance chip. ───────────────────
  useEffect(() => {
    if (!mapRef.current || !initializedRef.current) return
    const G = window.google.maps
    const map = mapRef.current
    const DomOverlay = domOverlayClassRef.current

    // Force a remeasure — markers created right after async init can otherwise
    // land off-canvas if the container changed size while booting.
    G.event.trigger(map, 'resize')

    pickupMarkerRef.current?.setMap(null)
    dropoffMarkerRef.current?.setMap(null)
    casingRef.current?.setMap(null)
    routeRef.current?.setMap(null)
    pickupLabelRef.current?.setMap(null)
    dropoffLabelRef.current?.setMap(null)
    chipRef.current?.setMap(null)
    pickupMarkerRef.current = null
    dropoffMarkerRef.current = null
    casingRef.current = null
    routeRef.current = null
    pickupLabelRef.current = null
    dropoffLabelRef.current = null
    chipRef.current = null
    routeBoundsRef.current = null

    const bounds = new G.LatLngBounds()
    const padding = { top: 76, right: 56, bottom: 76, left: 56 }

    if (pickup) {
      pickupMarkerRef.current = new G.Marker({
        map,
        position: { lat: pickup.lat, lng: pickup.lng },
        icon: { url: pinSvgUrl('#10B981', 'A'), scaledSize: new G.Size(32, 42), anchor: new G.Point(16, 42) },
        title: pickupAddress || 'Pickup',
        zIndex: 6,
      })
      bounds.extend({ lat: pickup.lat, lng: pickup.lng })
    }

    if (dropoff) {
      dropoffMarkerRef.current = new G.Marker({
        map,
        position: { lat: dropoff.lat, lng: dropoff.lng },
        icon: { url: pinSvgUrl('#EF4444', 'B'), scaledSize: new G.Size(32, 42), anchor: new G.Point(16, 42) },
        title: dropoffAddress || 'Drop-off',
        zIndex: 6,
      })
      bounds.extend({ lat: dropoff.lat, lng: dropoff.lng })
    }

    if (DomOverlay && pickup && pickupAddress) {
      pickupLabelRef.current = new DomOverlay({
        position: new G.LatLng(pickup.lat, pickup.lng),
        className: 'swifty-pin-label swifty-pin-label--pickup',
        html: `<span>${escapeHtml(pickupAddress)}</span>`,
      })
      pickupLabelRef.current.setMap(map)
    }

    if (DomOverlay && dropoff && dropoffAddress) {
      dropoffLabelRef.current = new DomOverlay({
        position: new G.LatLng(dropoff.lat, dropoff.lng),
        className: 'swifty-pin-label swifty-pin-label--dropoff',
        html: `<span>${escapeHtml(dropoffAddress)}</span>`,
      })
      dropoffLabelRef.current.setMap(map)
    }

    const drawFallbackRoute = (requestId) => {
      if (requestId !== routeRequestRef.current) return
      routeRef.current = new G.Polyline({
        map,
        path: [pickup, dropoff],
        strokeColor: ROUTE_COLOR,
        strokeOpacity: 0,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: ROUTE_COLOR, strokeWeight: 4, scale: 4 },
          offset: '0',
          repeat: '18px',
        }],
        zIndex: 4,
      })
      map.fitBounds(bounds, padding)
    }

    if (pickup && dropoff) {
      const requestId = ++routeRequestRef.current

      const handleRoute = (result, status) => {
        if (requestId !== routeRequestRef.current) return

        const route = status === 'OK' ? result?.routes?.[0] : null
        const path = route?.overview_path

        if (!route || !path || !path.length) {
          drawFallbackRoute(requestId)
          return
        }

        // Two stacked polylines: a soft white casing under an emerald line —
        // the classic Uber/inDrive "road trace" look.
        casingRef.current = new G.Polyline({
          map,
          path,
          strokeColor: '#ffffff',
          strokeOpacity: 0.95,
          strokeWeight: 10,
          zIndex: 3,
        })
        routeRef.current = new G.Polyline({
          map,
          path,
          strokeColor: ROUTE_COLOR,
          strokeOpacity: 1,
          strokeWeight: 4.5,
          zIndex: 4,
        })

        // Time + distance chip, anchored to the middle of the polyline.
        const leg = route.legs?.[0]
        if (DomOverlay && leg && (leg.duration?.text || leg.distance?.text)) {
          const mid = path[Math.floor(path.length / 2)]
          const parts = []
          if (leg.duration?.text) parts.push(`<strong>${escapeHtml(leg.duration.text)}</strong>`)
          if (leg.distance?.text) parts.push(`<span>${escapeHtml(leg.distance.text)}</span>`)
          chipRef.current = new DomOverlay({
            position: mid,
            className: 'swifty-route-chip-wrap',
            html: `<div class="swifty-route-chip">${parts.join('<i class="dot"></i>')}</div>`,
          })
          chipRef.current.setMap(map)
        }

        const routeBounds = route.bounds || bounds
        routeBoundsRef.current = routeBounds
        map.fitBounds(routeBounds, padding)
      }

      try {
        if (!directionsRef.current) directionsRef.current = new G.DirectionsService()
        directionsRef.current.route(
          { origin: pickup, destination: dropoff, travelMode: G.TravelMode.DRIVING },
          handleRoute,
        )
      } catch {
        drawFallbackRoute(requestId)
      }
    } else if (pickup) {
      map.setCenter({ lat: pickup.lat, lng: pickup.lng })
      map.setZoom(14)
    } else if (dropoff) {
      map.setCenter({ lat: dropoff.lat, lng: dropoff.lng })
      map.setZoom(14)
    }
  }, [
    pickup?.lat,
    pickup?.lng,
    dropoff?.lat,
    dropoff?.lng,
    pickupAddress,
    dropoffAddress,
    mapReady,
  ]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live: animated, rotating car for the rider/courier ───────────────────
  useEffect(() => {
    if (!mapRef.current || !initializedRef.current) return
    const G = window.google.maps
    const map = mapRef.current
    const DomOverlay = domOverlayClassRef.current

    const target = destination || dropoff
    const kmLeft = courier && target ? Math.round(haversineKm(courier, target) * 10) / 10 : null
    const riderName = courierInfo?.riderName || 'Driver en route'
    const riderVehicle = courierInfo?.vehicleType || courierInfo?.rideType || ''
    const riderPlate = courierInfo?.plateNumber || ''
    const riderPhone = courierInfo?.phone || ''

    carInfoRef.current = {
      position: courier ? { lat: courier.lat, lng: courier.lng } : null,
      content: `
        <div style="font-family:system-ui;font-size:12px;min-width:180px;padding:4px 2px">
          <p style="margin:0;font-weight:800;color:#0f172a">${escapeHtml(riderName)}</p>
          ${riderVehicle ? `<p style="margin:2px 0 0;color:#64748b">${escapeHtml(riderVehicle)}${riderPlate ? ' · ' + escapeHtml(riderPlate) : ''}</p>` : ''}
          ${kmLeft != null ? `<p style="margin:6px 0 0;font-weight:700;color:#10B981">${kmLeft} km to arrival</p>` : ''}
          ${riderPhone ? `<p style="margin:2px 0 0;color:#64748b">${escapeHtml(riderPhone)}</p>` : ''}
        </div>`,
    }

    if (!courier) {
      carRef.current?.setMap(null)
      carRef.current = null
      infoWindowRef.current?.close()
      return
    }

    const to = new G.LatLng(courier.lat, courier.lng)

    if (!carRef.current && DomOverlay) {
      carRef.current = new DomOverlay({
        position: to,
        className: 'swifty-car-overlay',
        html: carSvg(),
      })
      carRef.current.setMap(map)

      // Tap the car to see rider details + km remaining.
      const el = carRef.current.div
      if (el) {
        el.style.pointerEvents = 'auto'
        el.addEventListener('click', () => {
          const info = carInfoRef.current
          if (!info?.content) return
          if (!infoWindowRef.current) infoWindowRef.current = new G.InfoWindow()
          infoWindowRef.current.setContent(info.content)
          if (info.position) infoWindowRef.current.setPosition(info.position)
          infoWindowRef.current.open(map)
        })
      }
    } else if (carRef.current) {
      const from = carRef.current.position
      const fromPlain = { lat: from.lat(), lng: from.lng() }
      const toPlain = { lat: to.lat(), lng: to.lng() }
      carRef.current.setRotation(bearingDegrees(fromPlain, toPlain))
      animateOverlay(G, carRef.current, fromPlain, toPlain, 1400)
    }

    const view = map.getBounds()
    if (view && !view.contains(to)) map.panTo(to)
  }, [courier?.lat, courier?.lng, courierInfo, destination, dropoff])

  const showMapSkeleton = useDelayedLoading(!mapReady && !error)

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div ref={containerRef} className="absolute inset-0 lg:rounded-2xl overflow-hidden bg-surface-200" />
      {showMapSkeleton && (
        <SkeletonMap className="absolute inset-0 lg:rounded-2xl" />
      )}
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