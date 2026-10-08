# Swifty performance & reliability upgrade

## Install new server packages
    cd server && npm i compression helmet express-rate-limit

## New env vars (server, optional)
- GOOGLE_CLIENT_ID      – your Google OAuth client id (falls back to VITE_GOOGLE_CLIENT_ID)
- MONGO_POOL_SIZE       – default 100 connections per instance
- RUN_SCHEDULER=false   – set on all but ONE instance when you run several
- CLIENT_URL            – may now be a comma-separated list of allowed origins

## Server
- gzip compression, helmet security headers, 24h CORS preflight cache, ETags (304s)
- Rate limits: 30 sign-in attempts / 15 min, 600 req / min per IP – with clear messages
- Mongo pool 100, fast-fail timeouts, autoIndex off in production
- Indexes on deliveries (customer, rider+status, status+scheduledFor), notifications, users
- Auth middleware caches users 15s (auto-evicted on any user write) -> ~1 DB query saved per request
- Graceful shutdown, keep-alive tuned for load balancers, unhandled-rejection logging
- bcrypt cost 12 -> 10 (≈4x faster logins, still OWASP-compliant)
- Every error returns { code, message } with a precise message (invalid email or password,
  session expired, duplicate email, invalid id, DB unavailable, unknown route, ...)
- Google sign-in: login no longer auto-creates accounts ("No Swifty account is linked to this
  Google account. Please sign up first."), checks email_verified, 5s Google timeout,
  links Google to existing email accounts, password login on a Google-only account now says
  "This account uses Google sign-in" instead of crashing.

### Scaling to 100k concurrent users
One Node process will not hold 100k sockets. Run several instances behind a load balancer
with sticky sessions, add `@socket.io/redis-adapter` in socket.js so events reach every
instance, and swap utils/cache.js for Redis. The code is now stateless enough for this.

## Frontend
- Every page is lazy-loaded (code splitting); popular pages + Google Maps SDK preload on idle
- Blinking Swifty logo loader replaces every blank screen (only appears if loading >150ms)
- Brand entrance animation after login / sign-up / Google
- Pages render instantly from the cached session instead of waiting on the server
- Request layer: GET de-duplication, 5s cache, 15s timeouts, cache cleared after every write
- Expired session anywhere -> signed out once with "Session expired. Please sign in again."
- React Query: 30s fresh data, no refetch-on-focus, no retries on 4xx
- Google Maps: loaded exactly once (no polling), async loading; driving routes cached per
  trip (memory + session) so reopening a trip draws instantly and costs no API call
- Fixed a crash in History (hook called after an early return)
- Removed 43 unused files (unused UI kits, ActiveRideCard, use-mobile)

Tip: add to index.html <head>:
    <link rel="preconnect" href="https://maps.googleapis.com">
    <link rel="preconnect" href="https://maps.gstatic.com" crossorigin>
