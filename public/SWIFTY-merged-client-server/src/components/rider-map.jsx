import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from './delivery-map'

const API_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY

function jobPinSvg(color, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 9 15 25 15 25S30 24 30 15C30 6.7 23.3 0 15 0z" fill="${color}"/>
    <circle cx="15" cy="15" r="8" fill="white"/>
    <text x="15" y="19" text-anchor="middle" font-size="9" font-weight="800" fill="${color}">${label}</text>
  </svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

/**
 * RiderMap — overview map for the rider with a pin per available job.
 * Clicking a pin opens details; pending jobs include an "Accept" button.
 * Props:
 *   jobs: Array<{ id, customerName, type, packageType, rideType, price, distanceKm, pickup: { address, coords }, dropoff: { address }, status }>
 *   onAccept: (id) => void
 */
export function RiderMap({ jobs = [], onAccept }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const infoRef = useRef(null)
  const initializedRef = useRef(false)
  const onAcceptRef = useRef(onAccept)
  const [error, setError] = useState(null)

  const LAGOS = { lat: 6.5244, lng: 3.3792 }

  useEffect(() => { onAcceptRef.current = onAccept }, [onAccept])

  // Boot: create map once
  useEffect(() => {
    if (!API_KEY) { setError('no-key'); return }
    let cancelled = false

    loadGoogleMaps(API_KEY)
      .then(() => {
        if (cancelled || !containerRef.current || initializedRef.current) return
        const G = window.google.maps

        const map = new G.Map(containerRef.current, {
          center: LAGOS,
          zoom: 12,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        })

        infoRef.current = new G.InfoWindow()
        mapRef.current = map
        initializedRef.current = true
      })
      .catch((e) => setError(e.message))

    return () => { cancelled = true; mapRef.current = null; initializedRef.current = false; infoRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Live: update job markers whenever jobs array changes
  useEffect(() => {
    if (!mapRef.current || !initializedRef.current) return
    const G = window.google.maps
    const map = mapRef.current

    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    infoRef.current?.close()

    if (jobs.length === 0) return

    const bounds = new G.LatLngBounds()

    jobs.forEach((job) => {
      const coords = job.pickup?.coords
      if (!coords) return

      const isPending = job.status === 'pending'
      const color = isPending ? '#2563EB' : '#10B981'
      const label = isPending ? '!' : '▶'

      const marker = new G.Marker({
        map,
        position: { lat: coords.lat, lng: coords.lng },
        icon: {
          url: jobPinSvg(color, label),
          scaledSize: new G.Size(30, 40),
          anchor: new G.Point(15, 40),
        },
        title: `${job.id} — ${job.pickup.address}`,
        zIndex: isPending ? 10 : 5,
      })

      const kind = job.type === 'ride'
        ? `Ride · ${job.rideType || ''}`
        : `Delivery · ${job.packageType || ''}`
      const customer = job.customerName || 'Customer'

      const acceptButton = isPending
        ? `<button id="sw-accept" style="margin-top:8px;width:100%;padding:8px 10px;border:0;border-radius:10px;background:#16a34a;color:#fff;font-weight:700;font-size:12px;cursor:pointer">Accept ${job.type === 'ride' ? 'ride' : 'delivery'}</button>`
        : ''

      const content = `
        <div style="font-family:sans-serif;font-size:12px;max-width:200px;padding:2px 0">
          <p style="font-weight:800;margin:0 0 2px">${job.id}</p>
          <p style="margin:0;color:#64748b">${kind}</p>
          <p style="margin:6px 0 0;font-weight:700;color:#0f172a">${customer}</p>
          <p style="margin:2px 0 0;color:#64748b">From: ${job.pickup.address}</p>
          <p style="margin:2px 0 0;color:#64748b">To: ${job.dropoff?.address || '—'}</p>
          <p style="margin:4px 0 0;font-weight:700;color:#16a34a">₦${job.price ?? ''} · ${job.distanceKm ?? ''} km</p>
          <p style="margin:4px 0 0;font-weight:700;color:${color}">${isPending ? '⏳ Awaiting acceptance' : '🚀 Active'}</p>
          ${acceptButton}
        </div>`

      marker.addListener('click', () => {
        infoRef.current.setContent(content)
        infoRef.current.open({ anchor: marker, map })
        if (isPending) {
          G.event.addListenerOnce(infoRef.current, 'domready', () => {
            const btn = document.getElementById('sw-accept')
            if (btn) btn.onclick = () => onAcceptRef.current?.(job.id)
          })
        }
      })

      markersRef.current.push(marker)
      bounds.extend({ lat: coords.lat, lng: coords.lng })
    })

    if (jobs.length > 0) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
      const listener = G.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() > 14) map.setZoom(14)
      })
    }
  }, [jobs])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      {error === 'no-key' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <p className="text-sm font-semibold text-slate-600">Map not configured</p>
          <p className="text-xs text-slate-400 mt-1">Add <code>VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY</code> to .env</p>
        </div>
      )}
      {error && error !== 'no-key' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <p className="text-sm text-slate-500">Map unavailable</p>
        </div>
      )}
    </div>
  )
}
