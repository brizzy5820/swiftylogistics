# Swifty — architecture handoff

## Product direction
Swifty is now a movement platform, not only a package-delivery product. The customer experience supports rides, deliveries, pickup/drop-off workflows and future mobility services.

## Frontend modules
- `src/config/` — brand and design constants.
- `src/data/` — mock domain data. Replace these datasets with API responses without changing UI components.
- `src/services/` — backend boundary. The current implementation is intentionally mock-backed.
- `src/components/marketing/` — reusable landing-page sections and footer.
- `src/components/dashboard/` — reusable customer dashboard modules.
- `src/components/` — shared shell, maps and UI primitives.
- `src/pages/customer/` — customer-facing product modules.
- `src/pages/rider/` — rider-facing product modules.

## Backend reservation
Firebase has been removed from the source layer. The frontend now has a single backend boundary at `src/services/api.js`.

Planned production stack:
- Express.js API
- MongoDB
- Authentication middleware issuing secure sessions/tokens
- WebSocket layer for live driver/parcel location updates
- Object storage for user/vehicle/package media

When the Express server is ready, set `VITE_API_URL` and replace the mock implementations in `src/services/api.js`. Components should continue consuming service functions rather than calling `fetch()` directly.

## Mock-data rule
Every new feature should begin with a typed/structured mock dataset in `src/data/`. This makes the UI buildable before backend work and keeps the eventual API migration low-risk.

## Desktop dashboard direction
The customer dashboard has been moved toward a modern Uber-style information hierarchy: sticky global navigation, prominent booking/search area, service actions, live-trip card, recent activity and contextual sidebar cards. It is intentionally not a visual copy of Uber.
