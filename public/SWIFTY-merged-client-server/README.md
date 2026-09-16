# Swifty — Client + Express/MongoDB Backend

The project has been merged so the React client communicates with the Express API instead of the previous mock store.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI` and `JWT_SECRET`.
3. Optionally set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` for the provisioned admin account.
4. Install dependencies with `npm install`.
5. Run the API with `npm run server`.
6. Run the React client with `npm run dev`.

Vite proxies `/api` requests to `http://localhost:5000` during development.

## Default development admin

If no admin exists and admin environment variables are not supplied:

- Email: `admin@swifty.com`
- Password: `Admin@12345`

Change these values through `.env` before using a deployed environment.

## Main API areas

- `/api/auth` — registration, login, current user, password change
- `/api/users` — customer profile
- `/api/addresses` — saved addresses
- `/api/deliveries` — delivery orders
- `/api/rides` — ride orders
- `/api/tracking` — authenticated and public tracking
- `/api/riders` — rider profile, jobs and delivery status
- `/api/notifications` — notification endpoints
- `/api/support` — customer/admin support tickets
- `/api/admin` — administrator operations

Payments are intentionally not included in this merge; they remain the next integration phase.
