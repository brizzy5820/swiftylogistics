// Tiny in-process TTL + LRU cache. Zero dependencies, O(1) get/set.
// For multi-instance deployments swap the backing store for Redis using the same API.
export class TTLCache {
  constructor({ max = 10000, ttl = 30_000 } = {}) {
    this.max = max;
    this.ttl = ttl;
    this.map = new Map();
  }
  get(key) {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.exp < Date.now()) { this.map.delete(key); return undefined; }
    // refresh LRU position
    this.map.delete(key); this.map.set(key, hit);
    return hit.value;
  }
  set(key, value, ttl = this.ttl) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.max) this.map.delete(this.map.keys().next().value);
    this.map.set(key, { value, exp: Date.now() + ttl });
    return value;
  }
  delete(key) { this.map.delete(key); }
  clear() { this.map.clear(); }
}

// Authenticated user lookups happen on every request; cache them briefly.
export const userCache = new TTLCache({ max: 50000, ttl: 15_000 });
export const invalidateUser = (id) => userCache.delete(String(id));
