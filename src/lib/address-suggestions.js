// Enhanced Address Suggestions & Geocoding Service
// Provides real street-level address detection and suggestions via Geo APIs
// with seamless fallback to curated manual addresses on fetch failure.

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

async function queryOverpass(query, signal) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query,
        signal,
      })
      if (res.ok) return await res.json()
    } catch {
      // try the next mirror
    }
  }
  return null
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

function formatOverpassLabel(el, fallbackArea) {
  const tags = el.tags || {}
  if (tags['addr:housenumber'] && tags['addr:street']) {
    return [`${tags['addr:housenumber']} ${tags['addr:street']}`, tags['addr:suburb'] || fallbackArea]
      .filter(Boolean)
      .join(', ')
  }
  if (tags.name) {
    return [tags.name, fallbackArea].filter(Boolean).join(', ')
  }
  return null
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
 * Real nearby streets and house-numbered addresses around a point, sorted
 * closest-first. This is the "go deeper" piece — it returns actual named
 * streets and specific house addresses within `radiusMeters`, not just the
 * surrounding neighbourhood/LGA.
 */
export async function fetchNearbyPlaces(coords, radiusMeters = 700, signal) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return []

  const { lat, lng } = coords
  const query = `[out:json][timeout:12];(
    way["highway"]["name"](around:${radiusMeters},${lat},${lng});
    node["addr:housenumber"]["addr:street"](around:${Math.min(radiusMeters, 450)},${lat},${lng});
  );out center 40;`

  const data = await queryOverpass(query, signal)
  if (!data || !Array.isArray(data.elements)) return []

  const closest = findClosestLga(coords)
  const results = dedupeByLabel(
    data.elements.map((el) => {
      const point = overpassElementCoords(el)
      const label = point ? formatOverpassLabel(el, closest.name) : null
      return label ? { label, lga: closest.name, coords: point } : null
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
  const { lat, lng } = coords
  const escaped = query.replace(/[\\"]/g, '')
  if (!escaped) return []

  const overpassQuery = `[out:json][timeout:12];(
    way["highway"]["name"~"${escaped}",i](around:${radiusMeters},${lat},${lng});
    node["addr:housenumber"]["addr:street"~"${escaped}",i](around:${radiusMeters},${lat},${lng});
  );out center 25;`

  const data = await queryOverpass(overpassQuery, signal)
  if (!data || !Array.isArray(data.elements)) return []

  const closest = findClosestLga(coords)
  const results = dedupeByLabel(
    data.elements.map((el) => {
      const point = overpassElementCoords(el)
      const label = point ? formatOverpassLabel(el, closest.name) : null
      return label ? { label, lga: closest.name, coords: point } : null
    }),
  )

  results.sort((a, b) => calculateDistanceKm(coords, a.coords) - calculateDistanceKm(coords, b.coords))
  return results
}

/**
 * Reverse geocodes coordinates to exact street, neighborhood, and LGA.
 * Uses Photon API -> BigDataCloud -> Nominatim -> Manual LGA nearest fallback.
 * NEVER returns raw coordinate numbers.
 */
export async function reverseGeocodeDetails(coords, signal) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return null
  }

  const { lat, lng } = coords

  // 1. Try Photon Reverse Geocoding (Accurate street-level, fast, OpenStreetMap data)
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

  // 2. Try BigDataCloud Client Reverse Geocode API (Great locality and LGA coverage)
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

  // 3. Try Nominatim Reverse Geocoding (OSM mirror)
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

  // 4. Safe manual fallback based on closest LGA center (NEVER coord numbers)
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

  // Current location + close-by streets/addresses, resolved in parallel.
  const [currentLocation, nearby] = await Promise.all([
    fetchCurrentLocationSuggestion(coords, signal).catch(() => null),
    fetchNearbyPlaces(coords, 700, signal).catch(() => []),
  ])

  if (currentLocation) addAll([currentLocation])
  addAll(nearby)

  // Sparse OSM coverage right at this spot — widen the radius before
  // reaching for less-precise, broader-area sources.
  if (combined.length < MIN_INITIAL_SUGGESTIONS) {
    const wider = await fetchNearbyPlaces(coords, 2500, signal).catch(() => [])
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

  // 1. When we know the user's location, look for real nearby streets and
  //    house addresses matching the query first — this is what keeps
  //    results close to them instead of text-matching anywhere in Lagos.
  let nearbyMatches = []
  if (userCoords) {
    try {
      nearbyMatches = await fetchNearbyPlacesMatching(q, userCoords, 3000, signal)
    } catch {
      nearbyMatches = []
    }
  }

  // 2. Try Photon Geocoding API with location bias
  try {
    const latParam = userCoords?.lat ? `&lat=${userCoords.lat}&lon=${userCoords.lng}` : '&lat=6.5244&lon=3.3792'
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}${latParam}&limit=8`
    const res = await fetch(url, { signal })

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.features) && data.features.length > 0) {
        const results = data.features
          .map((f) => {
            const formatted = formatPhotonAddress(f.properties)
            if (!formatted || !formatted.label) return null
            const [lng, lat] = f.geometry.coordinates || []
            if (typeof lat !== 'number' || typeof lng !== 'number') return null
            return {
              label: formatted.label,
              lga: formatted.lga,
              coords: { lat, lng },
            }
          })
          .filter(Boolean)

        if (results.length > 0 || nearbyMatches.length > 0) {
          let merged = dedupeByLabel([...nearbyMatches, ...results])
          if (userCoords) {
            merged = merged.sort((a, b) => calculateDistanceKm(userCoords, a.coords) - calculateDistanceKm(userCoords, b.coords))
          }
          return merged.slice(0, 10)
        }
      }
    }
  } catch {
    // Continue to next provider on failure
  }

  // Photon failed outright, but we may still have nearby matches from step 1.
  if (nearbyMatches.length > 0) {
    return nearbyMatches.slice(0, 10)
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