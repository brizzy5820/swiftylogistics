// Server-side proxy for the OpenStreetMap geo services the address field needs.
//
// These upstreams cannot be called from a browser at all:
//
//   * Overpass answers HTTP 429 ("Please include a meaningful User-Agent
//     string with your requests to avoid rate-limiting") unless the request
//     carries a real UA — and `User-Agent` is a forbidden header for browser
//     `fetch`, so a client-side call is guaranteed to be throttled.
//   * Nominatim's usage policy requires a UA as well, and plain browser
//     traffic from a single IP gets blocked.
//
// Node can set that header, so the browser asks us and we ask them. Results
// are cached briefly because both upstreams are rate-limited public mirrors.
import AppError from "../utils/AppError.js";

const USER_AGENT =
  process.env.GEO_USER_AGENT ||
  "SwiftyDelivery/1.0 (https://swifty.app; geo-support@swifty.app)";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

// The browser abandons these requests after ~2s, so a request that lingers
// past that is wasted work — keep the budget tight enough that a failed lookup
// still falls back quickly on the client.
const OVERPASS_TIMEOUT_MS = 5000;
const NOMINATIM_TIMEOUT_MS = 5000;
const REVERSE_CACHE_TTL_MS = 10 * 60 * 1000;
const OVERPASS_CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 200;

const cache = new Map();

function readCache(key) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function writeCache(key, value, ttl) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expires: Date.now() + ttl });
}

function trimmed(value) {
  if (value === undefined || value === null) return null;
  const out = String(value).trim();
  return out || null;
}

// These upstreams are public, rate-limited and sometimes simply down. Report
// that as "unavailable" (503) rather than a server fault, so the client can
// fall back to its other providers knowingly instead of treating it as a bug.
const upstreamError = (message) => new AppError(message, 503);

async function fetchUpstream(url, init, timeoutMs) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en",
      ...(init?.headers || {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw upstreamError(`Geocoding service unavailable (${res.status})`);
  return res.json();
}

async function fetchOverpass(query) {
  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      return await fetchUpstream(
        endpoint,
        { method: "POST", headers: { "Content-Type": "text/plain" }, body: query },
        OVERPASS_TIMEOUT_MS
      );
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Overpass unavailable");
}

/**
 * Reverse geocodes a point. Returns the structured parts (no coordinates in
 * the label) that the client turns into a human address.
 */
export async function reverseGeocode(lat, lng) {
  // ~1m precision: enough to distinguish buildings, stable enough to cache.
  const key = `rev:${lat.toFixed(5)}:${lng.toFixed(5)}`;
  const cached = readCache(key);
  if (cached !== undefined) return cached;

  const url = `${NOMINATIM_URL}/reverse?format=json&zoom=18&addressdetails=1&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}`;

  const data = await fetchUpstream(url, undefined, NOMINATIM_TIMEOUT_MS);
  const addr = data.address || {};

  const result = {
    street: trimmed(addr.road || addr.pedestrian || addr.footway || addr.path),
    houseNumber: trimmed(addr.house_number),
    district: trimmed(
      addr.suburb || addr.neighbourhood || addr.quarter || addr.residential
    ),
    lga: trimmed(
      addr.city_district || addr.county || addr.state_district || addr.city
    ),
    state: trimmed(addr.state),
    displayName: trimmed(data.display_name),
  };

  writeCache(key, result, REVERSE_CACHE_TTL_MS);
  return result;
}

function elementCoords(el) {
  if (el.type === "node" && typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lng: el.lon };
  }
  if (
    el.center &&
    typeof el.center.lat === "number" &&
    typeof el.center.lon === "number"
  ) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

/**
 * Named streets and house-numbered buildings around a point, closest first.
 *
 * `query` narrows results to streets/addresses whose name matches, which is
 * what keeps typed results anchored to the user's actual street instead of
 * matching anywhere in Lagos.
 */
export async function nearbyPlaces({ lat, lng, radiusMeters = 700, query = "" }) {
  const houseRadius = Math.min(radiusMeters, 450);
  const filter = trimmed(query);
  const filterClause = filter
    ? `["name"~"${filter.replace(/[\\"]/g, "")}",i]`
    : '["name"]';

  const queryText = filter
    ? `[out:json][timeout:20];(
  way["highway"]${filterClause}(around:${radiusMeters},${lat},${lng});
  node["addr:housenumber"]["addr:street"]${filterClause}(around:${radiusMeters},${lat},${lng});
);out center 60;`
    : `[out:json][timeout:20];(
  way["highway"]["name"](around:${radiusMeters},${lat},${lng});
  node["addr:housenumber"](around:${houseRadius},${lat},${lng});
);out center 60;`;

  const key = `ovp:${queryText}`;
  let data = readCache(key);
  if (data === undefined) {
    data = await fetchOverpass(queryText);
    writeCache(key, data, OVERPASS_CACHE_TTL_MS);
  }

  const elements = Array.isArray(data?.elements) ? data.elements : [];

  const places = elements
    .map((el) => {
      const coords = elementCoords(el);
      if (!coords) return null;
      const tags = el.tags || {};
      const street = trimmed(tags["addr:street"]) || trimmed(tags.name);
      if (!street) return null;
      return {
        houseNumber: trimmed(tags["addr:housenumber"]),
        street,
        district: trimmed(
          tags["addr:suburb"] || tags["addr:neighbourhood"] || tags["addr:quarter"]
        ),
        name: trimmed(tags.name),
        coords,
      };
    })
    .filter(Boolean);

  const distanceKm = (a, b) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };

  places.sort((a, b) => distanceKm(lat, lng, a.coords) - distanceKm(lat, lng, b.coords));

  return places.slice(0, 60);
}

export default {
  reverseGeocode,
  nearbyPlaces,
};