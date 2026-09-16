export const ADDRESS_SUGGESTIONS = [
  { label: 'Lekki Phase 1', coords: { lat: 6.4328, lng: 3.4382 } },
  { label: 'Victoria Island', coords: { lat: 6.4270, lng: 3.43 } },
  { label: 'Ikeja City Mall', coords: { lat: 6.5964, lng: 3.3426 } },
  { label: 'Yaba Tech', coords: { lat: 6.5058, lng: 3.3799 } },
  { label: 'Surulere', coords: { lat: 6.4923, lng: 3.3652 } },
  { label: 'Magodo Estate', coords: { lat: 6.61, lng: 3.342 } },
]

export function resolveAddressCoords(label, fallback) {
  const match = ADDRESS_SUGGESTIONS.find(
    (suggestion) => suggestion.label.toLowerCase() === label.trim().toLowerCase(),
  )

  return match ? match.coords : fallback
}

export async function fetchLagosSuggestions(query, signal) {
  const q = (query || '').trim()

  if (!q || q.length < 2) {
    return ADDRESS_SUGGESTIONS
  }

  const viewbox = [2.6, 6.8, 4.0, 5.1].join(',')
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=ng&viewbox=${viewbox}&bounded=1&q=${encodeURIComponent(q)}`

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
  } catch {
    return ADDRESS_SUGGESTIONS
  }
}

export async function reverseGeocode(coords, signal) {
  if (!coords) return null

  const fallback = `Current location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=${encodeURIComponent(coords.lat)}&lon=${encodeURIComponent(coords.lng)}`

  try {
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
      signal,
    })

    if (!response.ok) throw new Error('Reverse geocode failed')

    const item = await response.json()
    return item.display_name || fallback
  } catch {
    return fallback
  }
}
