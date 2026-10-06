// Enhanced Address Suggestions & Geocoding Service
// Provides real street-level address detection and suggestions via Geo APIs
// with seamless fallback to curated manual addresses on fetch failure.
//
// Proxied where it has to be: Overpass and Nominatim both refuse requests
// without a meaningful User-Agent, and browsers cannot set that header, so
// those lookups go through our own server (see server/src/services/geo.service.js).
// Photon and BigDataCloud accept browser calls and are still used directly.
import { API_BASE_URL } from '../services/api'

export const ADDRESS_SUGGESTIONS = [
  // Lagos Mainland (Yaba, Akoka, Ebute Metta)
  { label: 'Herbert Macaulay Way, Yaba, Lagos Mainland', lga: 'Lagos Mainland', coords: { lat: 6.5058, lng: 3.3799 } },
  { label: 'Commercial Avenue, Sabo, Yaba, Lagos Mainland', lga: 'Lagos Mainland', coords: { lat: 6.5135, lng: 3.3768 } },
  { label: 'University of Lagos (UNILAG), Akoka, Lagos Mainland', lga: 'Lagos Mainland', coords: { lat: 6.5173, lng: 3.3989 } },
  { label: 'Yaba College of Technology, Yaba, Lagos Mainland', lga: 'Lagos Mainland', coords: { lat: 6.5186, lng: 3.3711 } },
  { label: 'Tejuosho Ultra Modern Market, Yaba, Lagos Mainland', lga: 'Lagos Mainland', coords: { lat: 6.5034, lng: 3.3688 } },
  { label: 'Jibowu Bus Terminal, Yaba, Lagos Mainland', lga: 'Lagos Mainland', coords: { lat: 6.5195, lng: 3.3694 } },
  { label: 'Ebute Metta, Lagos Mainland', lga: 'Lagos Mainland', coords: { lat: 6.4858, lng: 3.3846 } },

  // Eti-Osa (Lekki, Victoria Island, Ikoyi)
  { label: 'Admiralty Way, Lekki Phase 1, Eti-Osa', lga: 'Eti-Osa', coords: { lat: 6.4474, lng: 3.4735 } },
  { label: 'Lekki Phase 1, Eti-Osa', lga: 'Eti-Osa', coords: { lat: 6.4414, lng: 3.4705 } },
  { label: 'Victoria Island, Eti-Osa', lga: 'Eti-Osa', coords: { lat: 6.4281, lng: 3.4219 } },
  { label: 'Ahmadu Bello Way, Victoria Island, Eti-Osa', lga: 'Eti-Osa', coords: { lat: 6.4255, lng: 3.4158 } },
  { label: 'Ikoyi, Eti-Osa', lga: 'Eti-Osa', coords: { lat: 6.4549, lng: 3.4346 } },
  { label: 'Bourdillon Road, Ikoyi, Eti-Osa', lga: 'Eti-Osa', coords: { lat: 6.4521, lng: 3.4412 } },
  { label: 'Chevron Drive, Lekki, Eti-Osa', lga: 'Eti-Osa', coords: { lat: 6.4362, lng: 3.5356 } },
  { label: 'Lekki Conservation Centre, Lekki, Eti-Osa', lga: 'Eti-Osa', coords: { lat: 6.4385, lng: 3.5365 } },
  { label: 'Ajah Roundabout, Lekki-Epe Expressway, Eti-Osa', lga: 'Eti-Osa', coords: { lat: 6.4677, lng: 3.5875 } },

  // Ikeja (Alausa, GRA, Allen)
  { label: 'Ikeja City Mall, Alausa, Ikeja', lga: 'Ikeja', coords: { lat: 6.6189, lng: 3.3582 } },
  { label: 'Allen Avenue, Ikeja', lga: 'Ikeja', coords: { lat: 6.6014, lng: 3.3521 } },
  { label: 'Isaac John Street, GRA Ikeja', lga: 'Ikeja', coords: { lat: 6.5885, lng: 3.3571 } },
  { label: 'Computer Village, Otigba Street, Ikeja', lga: 'Ikeja', coords: { lat: 6.5936, lng: 3.3421 } },
  { label: 'Alausa Secretariat, Ikeja', lga: 'Ikeja', coords: { lat: 6.6178, lng: 3.3551 } },
  { label: 'Maryland Mall, Ikorodu Road, Ikeja', lga: 'Ikeja', coords: { lat: 6.5721, lng: 3.3672 } },
  { label: 'Murtala Muhammed International Airport, Ikeja', lga: 'Ikeja', coords: { lat: 6.5774, lng: 3.3212 } },

  // Surulere
  { label: 'Adeniran Ogunsanya Street, Surulere', lga: 'Surulere', coords: { lat: 6.4947, lng: 3.3576 } },
  { label: 'Bode Thomas Street, Surulere', lga: 'Surulere', coords: { lat: 6.4925, lng: 3.3523 } },
  { label: 'National Stadium, Surulere', lga: 'Surulere', coords: { lat: 6.4981, lng: 3.3644 } },
  { label: 'Ojuelegba Roundabout, Surulere', lga: 'Surulere', coords: { lat: 6.5142, lng: 3.3619 } },
  { label: 'Aguda, Surulere', lga: 'Surulere', coords: { lat: 6.4975, lng: 3.3411 } },

  // Kosofe (Magodo, Ogudu)
  { label: 'Magodo Phase 2 Estate, Shangisha, Kosofe', lga: 'Kosofe', coords: { lat: 6.6212, lng: 3.3815 } },
  { label: 'Ogudu GRA, Kosofe', lga: 'Kosofe', coords: { lat: 6.5824, lng: 3.3887 } },
  { label: 'Ketu Bus Stop, Kosofe', lga: 'Kosofe', coords: { lat: 6.6021, lng: 3.3912 } },

  // Oshodi-Isolo
  { label: 'Oshodi Transport Interchange, Oshodi-Isolo', lga: 'Oshodi-Isolo', coords: { lat: 6.5562, lng: 3.3512 } },
  { label: 'Ajao Estate, Isolo, Oshodi-Isolo', lga: 'Oshodi-Isolo', coords: { lat: 6.5412, lng: 3.3325 } },
  { label: 'Ago Palace Way, Okota, Oshodi-Isolo', lga: 'Oshodi-Isolo', coords: { lat: 6.5085, lng: 3.3214 } },

  // Lagos Island
  { label: 'Broad Street, Marina, Lagos Island', lga: 'Lagos Island', coords: { lat: 6.4531, lng: 3.3958 } },
  { label: 'Tafawa Balewa Square (TBS), Lagos Island', lga: 'Lagos Island', coords: { lat: 6.4468, lng: 3.4021 } },
  { label: 'Balogun Market, Lagos Island', lga: 'Lagos Island', coords: { lat: 6.4562, lng: 3.3854 } },

  // Alimosho
  { label: 'Egbeda Bus Stop, Alimosho', lga: 'Alimosho', coords: { lat: 6.6015, lng: 3.2891 } },
  { label: 'Iyana Ipaja, Alimosho', lga: 'Alimosho', coords: { lat: 6.6185, lng: 3.2912 } },
]

export const LGA_CENTERS = [
  { name: 'Lagos Mainland', alias: ['mainland', 'yaba', 'akoka', 'ebute metta'], lat: 6.5058, lng: 3.3799 },
  { name: 'Eti-Osa', alias: ['eti osa', 'lekki', 'victoria island', 'vi', 'ikoyi', 'ajah'], lat: 6.4414, lng: 3.4705 },
  { name: 'Ikeja', alias: ['ikeja', 'alausa', 'allen', 'maryland'], lat: 6.6014, lng: 3.3521 },
  { name: 'Surulere', alias: ['surulere', 'ojuelegba', 'aguda', 'masha'], lat: 6.4947, lng: 3.3576 },
  { name: 'Kosofe', alias: ['kosofe', 'magodo', 'ogudu', 'ketu', 'mile 12'], lat: 6.6212, lng: 3.3815 },
  { name: 'Oshodi-Isolo', alias: ['oshodi', 'isolo', 'okota', 'ajao'], lat: 6.5562, lng: 3.3512 },
  { name: 'Lagos Island', alias: ['lagos island', 'marina', 'broad street', 'cms'], lat: 6.4531, lng: 3.3958 },
  { name: 'Alimosho', alias: ['alimosho', 'egbeda', 'iyana ipaja', 'ikotun'], lat: 6.6015, lng: 3.2891 },
  { name: 'Apapa', alias: ['apapa', 'wharf'], lat: 6.4485, lng: 3.3642 },
  { name: 'Somolu', alias: ['somolu', 'bariga', 'fadeyi'], lat: 6.5385, lng: 3.3821 },
  { name: 'Ikorodu', alias: ['ikorodu', 'agric'], lat: 6.6185, lng: 3.5085 },
]

// Minimum size for the first (pre-typing) suggestion set — this is what
// guarantees pickup/dropoff always opens with a real, usable list rather
// than two or three sparse results.
const MIN_INITIAL_SUGGESTIONS = 10
const MAX_INITIAL_SUGGESTIONS = 14

function calculateDistanceKm(a, b) {
  if (!a || !b) return 999999
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

export function findClosestLga(coords) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return LGA_CENTERS[0]
  }

  let closest = LGA_CENTERS[0]
  let minDist = calculateDistanceKm(coords, closest)

  for (let i = 1; i < LGA_CENTERS.length; i++) {
    const dist = calculateDistanceKm(coords, LGA_CENTERS[i])
    if (dist < minDist) {
      minDist = dist
      closest = LGA_CENTERS[i]
    }
  }

  return closest
}

// Return manual suggestions sorted so that addresses matching the user's LGA / vicinity come first
export function getManualSuggestionsByLocation(coords, lgaName) {
  let targetLga = lgaName

  if (!targetLga && coords) {
    const closest = findClosestLga(coords)
    targetLga = closest.name
  }

  if (!targetLga) {
    return ADDRESS_SUGGESTIONS
  }

  const normalized = targetLga.toLowerCase()

  // Find exact or partial matches for LGA
  const matched = ADDRESS_SUGGESTIONS.filter((item) => {
    if (item.lga && item.lga.toLowerCase().includes(normalized)) return true
    if (item.label.toLowerCase().includes(normalized)) return true
    return false
  })

  const others = ADDRESS_SUGGESTIONS.filter((item) => !matched.includes(item))

  // Sort matched by distance if coords available
  if (coords) {
    matched.sort((a, b) => calculateDistanceKm(coords, a.coords) - calculateDistanceKm(coords, b.coords))
    others.sort((a, b) => calculateDistanceKm(coords, a.coords) - calculateDistanceKm(coords, b.coords))
  }

  return [...matched, ...others]
}

export function resolveAddressCoords(label, fallback) {
  if (!label) return fallback

  const clean = label.trim().toLowerCase()
  const match = ADDRESS_SUGGESTIONS.find(
    (s) => s.label.toLowerCase() === clean || clean.includes(s.label.toLowerCase()) || s.label.toLowerCase().includes(clean),
  )

  return match ? match.coords : fallback
}

/**
 * Cleanly format Photon feature properties into an accurate street address
 */
function formatPhotonAddress(properties) {
  if (!properties) return null

  const streetName = properties.street || (properties.type === 'street' ? properties.name : null)
  const fullStreet = properties.housenumber && streetName
    ? `${properties.housenumber} ${streetName}`
    : streetName || properties.name

  const district = properties.district || (properties.type !== 'street' && properties.name !== fullStreet ? properties.name : null)
  const lga = properties.county || properties.city
  const state = properties.state

  const parts = [fullStreet, district, lga, state].filter(Boolean)
  // Deduplicate parts while preserving order
  const uniqueParts = parts.filter((part, idx) => parts.indexOf(part) === idx)

  return {
    label: uniqueParts.join(', '),
    street: fullStreet || district || lga,
    district,
    lga,
    state,
  }
}

// ---------------------------------------------------------------------
// Overpass (OpenStreetMap) nearby street + house-address search.
//
// Photon and Nominatim are both *text* search engines — they rank by how
// well a query string matches, with location only used as a tie-breaker.
// That's why asking them for "things near this point" (e.g. by querying
// the LGA name) doesn't actually return close results. Overpass is the
// right tool for "what's physically within N metres of this point" — it
// queries OSM's raw map data directly for named streets (ways) and
// house-numbered buildings (nodes) inside a radius, which is what gives
// genuinely close, street/house-level suggestions.
// ---------------------------------------------------------------------

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

// Public Overpass mirrors are slow and rate-limited: a cold query routinely
// takes 5–15s, and a busy one can hang until the server-side timeout. Since
// these lookups sit directly in front of the address autocomplete, every
// Overpass request is capped at a few seconds and remembered briefly — so a
// hanging mirror delays nothing, and retyping the same characters costs no
// extra requests.
const OVERPASS_TIMEOUT_MS = 3500
const OVERPASS_CACHE_TTL_MS = 90_000
const OVERPASS_CACHE_MAX = 60
const overpassCache = new Map()

function overpassSignal(signal) {
  const timeout = AbortSignal.timeout(OVERPASS_TIMEOUT_MS)
  // AbortSignal.any needs a modern browser; fall back to the timeout alone
  // rather than giving up on the cancellation the caller asked for.
  if (typeof AbortSignal.any === 'function') {
    return signal ? AbortSignal.any([signal, timeout]) : timeout
  }
  return timeout
}

function readOverpassCache(query) {
  const hit = overpassCache.get(query)
  if (!hit) return undefined
  if (Date.now() > hit.expires) {
    overpassCache.delete(query)
    return undefined
  }
  return hit.data
}

function writeOverpassCache(query, data) {
  if (overpassCache.size >= OVERPASS_CACHE_MAX) {
    // Cheap eviction: drop the oldest insertion, which Map preserves for us.
    const oldest = overpassCache.keys().next().value
    if (oldest !== undefined) overpassCache.delete(oldest)
  }
  overpassCache.set(query, { data, expires: Date.now() + OVERPASS_CACHE_TTL_MS })
}

async function queryOverpass(query, signal) {
  const cached = readOverpassCache(query)
  if (cached !== undefined) return cached

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query,
        signal: overpassSignal(signal),
      })
      if (!res.ok) continue
      const data = await res.json()
      writeOverpassCache(query, data)
      return data
    } catch {
      // Timed out, blocked or offline — try the next mirror.
    }
  }
  return null
}

// Public Overpass mirrors take seconds (or fail outright), which is fine for
// seeding a list once but fatal for an autocomplete the user is typing into.
// These deadlines let the fast text index answer on its own, with Overpass
// merged in only when it happens to be quick enough to be worth waiting for.
const NEARBY_ENRICH_DEADLINE_MS = 1200
const SEED_ENRICH_DEADLINE_MS = 2500

function withDeadline(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallback), ms)
    }),
  ])
}

// Proxy calls get their own short budget so a slow or unreachable API can never
// hold up the field — the caller falls back to its direct providers instead.
const PROXY_TIMEOUT_MS = 2500

function proxySignal(signal, ms = PROXY_TIMEOUT_MS) {
  const timeout = AbortSignal.timeout(ms)
  if (typeof AbortSignal.any === 'function') {
    return signal ? AbortSignal.any([signal, timeout]) : timeout
  }
  return timeout
}

function overpassElementCoords(el) {
  if (el.type === 'node' && typeof el.lat === 'number' && typeof el.lon === 'number') {
    return { lat: el.lat, lng: el.lon }
  }
  if (el.center && typeof el.center.lat === 'number' && typeof el.center.lon === 'number') {
    return { lat: el.center.lat, lng: el.center.lon }
  }
  return null
}

// Map tags arrive as strings that are often blank; normalise once here rather
// than letting "" flow into labels as ", ,".
function trimmed(value) {
  if (value === undefined || value === null) return null
  const out = String(value).trim()
  return out || null
}

function dedupeByLabel(items) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    if (!item || !item.label) continue
    const key = item.label.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

/**
 * Asks our own server for streets/addresses near a point.
 *
 * Overpass is unreachable from a browser by design — it answers HTTP 429
 * unless the request carries a meaningful `User-Agent`, which `fetch` forbids
 * the page from setting — so this proxy is the only compliant path. Returns
 * null when the API isn't reachable (static hosting, dev without the server),
 * and the caller falls back to the mirrors.
 */
async function fetchNearbyViaProxy({ coords, radiusMeters, query }, signal) {
  try {
    const params = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      radius: String(Math.round(radiusMeters)),
    })
    if (query) params.set('q', query)

    const res = await fetch(`${API_BASE_URL}/addresses/geo/nearby?${params.toString()}`, {
      signal: proxySignal(signal, 2500),
    })
    if (!res.ok) return null

    const data = await res.json()
    if (!Array.isArray(data?.places)) return null

    return data.places
      .map((place) => {
        if (!place?.coords || !place?.street) return null
        return {
          houseNumber: place.houseNumber || null,
          street: place.street,
          district: place.district || null,
          name: place.name || null,
          coords: place.coords,
        }
      })
      .filter(Boolean)
  } catch {
    return null
  }
}

// Direct mirrors: kept only as a fallback for when the proxy is unavailable.
async function fetchNearbyViaOverpass({ coords, radiusMeters, query }, signal) {
  const { lat, lng } = coords
  const queryText = query
    ? `[out:json][timeout:12];(
    way["highway"]["name"~"${query.replace(/[\\"]/g, '')}",i](around:${radiusMeters},${lat},${lng});
    node["addr:housenumber"]["addr:street"~"${query.replace(/[\\"]/g, '')}",i](around:${radiusMeters},${lat},${lng});
  );out center 25;`
    : `[out:json][timeout:12];(
    way["highway"]["name"](around:${radiusMeters},${lat},${lng});
    node["addr:housenumber"]["addr:street"](around:${Math.min(radiusMeters, 450)},${lat},${lng});
  );out center 40;`

  const data = await queryOverpass(queryText, signal)
  if (!data || !Array.isArray(data.elements)) return []

  return data.elements
    .map((el) => {
      const point = overpassElementCoords(el)
      if (!point) return null
      const tags = el.tags || {}
      const street = trimmed(tags['addr:street']) || trimmed(tags.name)
      if (!street) return null
      return {
        houseNumber: trimmed(tags['addr:housenumber']),
        street,
        district: trimmed(tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:quarter']),
        name: trimmed(tags.name),
        coords: point,
      }
    })
    .filter(Boolean)
}

function placeLabel(place, lgaName) {
  if (place.houseNumber && place.street) {
    return [place.houseNumber + ' ' + place.street, place.district || lgaName]
      .filter(Boolean)
      .join(', ')
  }
  return [place.name || place.street, place.district || lgaName].filter(Boolean).join(', ')
}

/**
 * Real nearby streets and house-numbered addresses around a point, sorted
 * closest-first. This is the "go deeper" piece — it returns actual named
 * streets and specific house addresses within `radiusMeters`, not just the
 * surrounding neighbourhood/LGA.
 */
export async function fetchNearbyPlaces(coords, radiusMeters = 700, signal) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return []

  const request = { coords, radiusMeters, query: '' }
  let places = await fetchNearbyViaProxy(request, signal)
  if (!places) places = await fetchNearbyViaOverpass(request, signal)
  if (!places.length) return []

  const lgaName = findClosestLga(coords).name
  const results = dedupeByLabel(
    places.map((place) => {
      const label = placeLabel(place, lgaName)
      return label ? { label, lga: lgaName, coords: place.coords } : null
    }),
  )

  results.sort((a, b) => calculateDistanceKm(coords, a.coords) - calculateDistanceKm(coords, b.coords))
  return results
}

/**
 * Same idea as fetchNearbyPlaces, but filtered to streets/addresses whose
 * name matches `query` — used while the user is typing, so results stay
 * anchored to their actual location instead of matching anywhere in Lagos.
 */
export async function fetchNearbyPlacesMatching(query, coords, radiusMeters = 3000, signal) {
  if (!coords || !query) return []

  const request = { coords, radiusMeters, query }
  let places = await fetchNearbyViaProxy(request, signal)
  if (!places) places = await fetchNearbyViaOverpass(request, signal)
  if (!places.length) return []

  const lgaName = findClosestLga(coords).name
  const results = dedupeByLabel(
    places.map((place) => {
      const label = placeLabel(place, lgaName)
      return label ? { label, lga: lgaName, coords: place.coords } : null
    }),
  )

  results.sort((a, b) => calculateDistanceKm(coords, a.coords) - calculateDistanceKm(coords, b.coords))
  return results
}

/**
 * Reverse geocodes coordinates to exact street, neighborhood, and LGA.
 *
 * Nominatim is reached through our own server because, like Overpass, it
 * refuses requests without a meaningful `User-Agent` and blocks generic
 * browser traffic — so the direct call at the bottom is only a fallback.
 * NEVER returns raw coordinate numbers.
 */
export async function reverseGeocodeDetails(coords, signal) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return null
  }

  const { lat, lng } = coords

// 1. Our proxy -> Nominatim. The deepest structured address available, and
  //    the only street-level source reachable from here.
  try {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
    const res = await fetch(`${API_BASE_URL}/addresses/geo/reverse?${params.toString()}`, {
      signal: proxySignal(signal),
    })

    if (res.ok) {
      const data = await res.json()
      const d = data?.details
      if (d && (d.street || d.district || d.lga)) {
        const lga = d.lga || d.district
        const parts = [d.houseNumber && d.street ? `${d.houseNumber} ${d.street}` : d.street, d.district, lga, d.state]
          .filter(Boolean)
        const uniqueParts = parts.filter((p, i) => parts.indexOf(p) === i)

        if (uniqueParts.length > 0) {
          return {
            label: uniqueParts.join(', '),
            street: d.street || d.district || lga,
            district: d.district,
            lga,
            state: d.state,
            coords: { lat, lng },
          }
        }
      }
    }
  } catch {
    // Proxy unavailable — fall through to the direct providers.
  }

  // 2. Try Photon Reverse Geocoding (Accurate street-level, fast, OpenStreetMap data)
  try {
    const url = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
      signal,
    })

    if (res.ok) {
      const data = await res.json()
      const feature = data.features?.[0]
      if (feature && feature.properties) {
        const formatted = formatPhotonAddress(feature.properties)
        if (formatted && formatted.label) {
          return {
            label: formatted.label,
            street: formatted.street,
            district: formatted.district,
            lga: formatted.lga,
            state: formatted.state,
            coords: { lat, lng },
          }
        }
      }
    }
  } catch {
    // Continue to next provider on failure
  }

  // 3. Try BigDataCloud Client Reverse Geocode API (Great locality and LGA coverage)
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`
    const res = await fetch(url, { signal })

    if (res.ok) {
      const data = await res.json()
      const locality = data.locality || data.city
      const lga = data.localityInfo?.administrative?.find((a) => a.adminLevel === 6)?.name || data.locality
      const state = data.principalSubdivision || 'Lagos'
      const parts = [locality, lga, state].filter(Boolean)
      const uniqueParts = parts.filter((p, i) => parts.indexOf(p) === i)

      if (uniqueParts.length > 0) {
        return {
          label: uniqueParts.join(', '),
          street: locality,
          district: locality,
          lga: lga || locality,
          state,
          coords: { lat, lng },
        }
      }
    }
  } catch {
    // Continue to next provider on failure
  }

  // 4. Nominatim direct (fallback for when the proxy is unreachable)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
      signal,
    })

    if (res.ok) {
      const item = await res.json()
      const addr = item.address || {}
      const street = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood
      const district = addr.suburb || addr.neighbourhood
      const lga = addr.city_district || addr.county || addr.city
      const state = addr.state

      const parts = [street, district, lga, state].filter(Boolean)
      const uniqueParts = parts.filter((p, i) => parts.indexOf(p) === i)

      if (uniqueParts.length > 0) {
        return {
          label: uniqueParts.join(', '),
          street: street || district || lga,
          district,
          lga,
          state,
          coords: { lat, lng },
        }
      }

      if (item.display_name) {
        return {
          label: item.display_name,
          street: street || lga,
          district,
          lga,
          coords: { lat, lng },
        }
      }
    }
  } catch {
    // Continue to manual fallback
  }

  // 5. Safe manual fallback based on closest LGA center (NEVER coord numbers)
  const closest = findClosestLga(coords)
  return {
    label: `Near ${closest.name}, Lagos`,
    street: closest.name,
    district: closest.name,
    lga: closest.name,
    coords: { lat, lng },
  }
}

/**
 * Returns string label for backward compatibility with reverseGeocode(coords, signal)
 */
export async function reverseGeocode(coords, signal) {
  if (!coords) return null
  const details = await reverseGeocodeDetails(coords, signal)
  return details ? details.label : null
}

/**
 * A single "Current location" suggestion entry — the user's own position,
 * resolved to a readable street address (never raw coordinates) so it can
 * sit at the top of the pickup/dropoff list like "Use my current location"
 * does in most ride apps.
 */
export async function fetchCurrentLocationSuggestion(coords, signal) {
  if (!coords) return null
  const details = await reverseGeocodeDetails(coords, signal)
  if (!details) return null
  return {
    label: `Current location — ${details.label}`,
    coords,
    lga: details.lga,
    isCurrentLocation: true,
  }
}

/**
 * Fetch initial suggestions relating to user's location & LGA.
 *
 * Always anchored to the user's actual position when `coords` is given:
 * their current location (reverse-geocoded) comes first, then real nearby
 * streets and house addresses (Overpass), widening the search radius and
 * layering in broader-area and curated results only as needed to guarantee
 * at least MIN_INITIAL_SUGGESTIONS results.
 */
export async function fetchInitialLocationSuggestions(coords, lgaName, signal) {
  const manualList = getManualSuggestionsByLocation(coords, lgaName)

  if (!coords) {
    // No location to anchor "nearby" to — the curated, LGA-filtered list
    // is the best we can do.
    return manualList.slice(0, MAX_INITIAL_SUGGESTIONS)
  }

  let combined = []
  function addAll(items) {
    combined = dedupeByLabel([...combined, ...items])
  }

// Current location + close-by streets/addresses, resolved in parallel — but
  // only the reverse geocode is allowed to hold this up. The nearby-streets
  // lookup goes through a deadline too: when the map service is slow or
  // blocked, the opening list still appears immediately (current location
  // plus the curated streets) instead of sitting empty.
  const [currentLocation, nearby] = await Promise.all([
    fetchCurrentLocationSuggestion(coords, signal).catch(() => null),
    withDeadline(
      fetchNearbyPlaces(coords, 700, signal).catch(() => []),
      SEED_ENRICH_DEADLINE_MS,
      [],
    ),
  ])

  if (currentLocation) addAll([currentLocation])
  addAll(nearby)

  // Sparse OSM coverage right at this spot — widen the radius before
  // reaching for less-precise, broader-area sources.
  if (combined.length < MIN_INITIAL_SUGGESTIONS) {
    const wider = await withDeadline(
      fetchNearbyPlaces(coords, 2500, signal).catch(() => []),
      SEED_ENRICH_DEADLINE_MS,
      [],
    )
    addAll(wider)
  }

  // Still short — bring in Photon's broader area/axis search.
  if (combined.length < MIN_INITIAL_SUGGESTIONS) {
    const queryLga = lgaName || findClosestLga(coords).name
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(queryLga || 'Lagos')}&lat=${coords.lat}&lon=${coords.lng}&limit=10`
      const res = await fetch(url, { signal })
      if (res.ok) {
        const data = await res.json()
        const fetched = (data.features || [])
          .map((f) => {
            const formatted = formatPhotonAddress(f.properties)
            if (!formatted || !formatted.label) return null
            const [lng, lat] = f.geometry.coordinates || []
            if (typeof lat !== 'number' || typeof lng !== 'number') return null
            return { label: formatted.label, lga: formatted.lga, coords: { lat, lng } }
          })
          .filter(Boolean)
        addAll(fetched)
      }
    } catch {
      // fall through to the manual list below
    }
  }

  // Final top-up from the curated list so we always meet the minimum.
  if (combined.length < MIN_INITIAL_SUGGESTIONS) {
    addAll(manualList)
  }

  // Current location stays pinned first; everything else sorted by actual
  // distance from the user.
  const pinned = combined.filter((item) => item.isCurrentLocation)
  const rest = combined
    .filter((item) => !item.isCurrentLocation)
    .sort((a, b) => calculateDistanceKm(coords, a.coords) - calculateDistanceKm(coords, b.coords))

  return [...pinned, ...rest].slice(0, MAX_INITIAL_SUGGESTIONS)
}

/**
 * Searches real addresses, preferring results genuinely close to the user
 * (Overpass) and falling back through Photon, Nominatim, and finally the
 * curated manual list on failure.
 */
export async function fetchLagosSuggestions(query, options = {}, signal) {
  let userCoords = null
  let userLga = null

  // Support old signature: fetchLagosSuggestions(query, signal)
  if (options instanceof AbortSignal) {
    signal = options
  } else if (options && typeof options === 'object') {
    userCoords = options.userCoords || null
    userLga = options.userLga || null
  }

  const q = (query || '').trim()

  // When query is empty or 1 character: return first set relating to user's location & LGA
  if (!q || q.length < 2) {
    return fetchInitialLocationSuggestions(userCoords, userLga, signal)
  }

  // 1 & 2. Overpass (real streets/house numbers near the user) and Photon (the
  //      text index) run *together*, not one after the other.
  //
//      This ordering is the whole reason the field felt dead: Overpass was
  //      awaited first, and a public mirror that is slow, blocked or
  //      rate-limited answers in 5–15s or not at all — so every keystroke sat
  //      in silence before the fast text index was even asked. Both run
  //      together now, and the nearby lookup gets a deadline: results appear
  //      when the text index answers (~1s), not when the map service does.
  const nearbyPromise = userCoords
    ? fetchNearbyPlacesMatching(q, userCoords, 3000, signal, userLga).catch(() => [])
    : Promise.resolve([])

  const photonPromise = (async () => {
    try {
      const latParam = userCoords?.lat ? `&lat=${userCoords.lat}&lon=${userCoords.lng}` : '&lat=6.5244&lon=3.3792'
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}${latParam}&limit=8`
      const res = await fetch(url, { signal })

      if (!res.ok) return []
      const data = await res.json()
      if (!Array.isArray(data.features)) return []

      return data.features
        .map((f) => {
          const formatted = formatPhotonAddress(f.properties)
          if (!formatted || !formatted.label) return null
          const [lng, lat] = f.geometry.coordinates || []
          if (typeof lat !== 'number' || typeof lng !== 'number') return null
          return {
            label: formatted.label,
            lga: trimmed(formatted.lga) || userLga,
            coords: { lat, lng },
          }
        })
        .filter(Boolean)
    } catch {
      return []
    }
  })()

  const [nearbyMatches, photonResults] = await Promise.all([
    withDeadline(nearbyPromise, NEARBY_ENRICH_DEADLINE_MS, []),
    photonPromise,
  ])

  if (photonResults.length > 0 || nearbyMatches.length > 0) {
    let merged = dedupeByLabel([...nearbyMatches, ...photonResults])
    if (userCoords) {
      merged = merged.sort((a, b) => calculateDistanceKm(userCoords, a.coords) - calculateDistanceKm(userCoords, b.coords))
    }
    return merged.slice(0, 10)
  }

  // 3. Try Nominatim Geocoding API (OSM bounded to Lagos/Nigeria)
  try {
    const viewbox = [2.6, 6.8, 4.0, 5.1].join(',')
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=ng&viewbox=${viewbox}&bounded=1&q=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
      signal,
    })

    if (res.ok) {
      const items = await res.json()
      if (Array.isArray(items) && items.length > 0) {
        return items.map((item) => ({
          label: item.display_name,
          coords: { lat: Number(item.lat), lng: Number(item.lon) },
        }))
      }
    }
  } catch {
    // Continue to manual fallback
  }

  // 4. Fallback to manual suggestions filtered by query
  const queryLower = q.toLowerCase()
  const filtered = ADDRESS_SUGGESTIONS.filter((s) =>
    s.label.toLowerCase().includes(queryLower) || (s.lga && s.lga.toLowerCase().includes(queryLower)),
  )

  if (filtered.length > 0) {
    return filtered
  }

  return getManualSuggestionsByLocation(userCoords, userLga)
}

/**
 * Gets high-accuracy current location from device
 */
export function getCurrentPositionHighAccuracy(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
        ...options,
      },
    )
  })
}
