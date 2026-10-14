/**
 * End-to-end verification of the guest booking flow over real HTTP:
 *   1. register a rider (no googleId — the case that previously failed)
 *   2. a guest creates a ride with only an email + phone (no auth header)
 *   3. the rider's job list must include it
 *   4. the rider accepts it
 *
 * Run with: node scripts/check-guest-http.mjs
 */
const BASE = process.env.API_BASE_URL || 'http://localhost:5000/api'

const post = async (path, body, token) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

const patch = async (path, body, token) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

const get = async (path, token) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

let failures = 0
const check = (label, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`)
  if (!ok) failures += 1
}

const stamp = Date.now().toString(36)

// 1. A rider registers without a Google ID.
const riderReg = await post('/auth/register', {
  name: 'HTTP Check Rider',
  email: `check.rider.${stamp}@swifty.com`,
  password: 'Passw0rd!23',
  phone: '08091112222',
  role: 'rider',
})
check('rider registers without googleId', riderReg.status === 201 && riderReg.data.user?.id, `status ${riderReg.status} ${JSON.stringify(riderReg.data).slice(0, 120)}`)
const riderToken = riderReg.data.accessToken

// 2. A guest creates a ride with no authentication at all.
const guestRide = await post('/rides', {
  pickup: { address: 'Herbert Macaulay Way, Yaba, Lagos', coords: { lat: 6.5058, lng: 3.3799 } },
  dropoff: { address: 'Lekki Phase 1, Lagos', coords: { lat: 6.4414, lng: 3.4705 } },
  rideType: 'standard',
  paymentMethod: 'cash',
  customPrice: 2600,
  email: `check.guest.${stamp}@test.com`,
  phone: '08012345678',
})
check('guest creates a ride with no account', guestRide.status === 201 && guestRide.data.ride?._id, `status ${guestRide.status} ${JSON.stringify(guestRide.data).slice(0, 120)}`)
check('guest ride is pending so riders can take it', guestRide.data.ride?.status === 'pending')
check('guest contact stored on the order', Boolean(guestRide.data.ride?.guestEmail && guestRide.data.ride?.guestPhone))

const ride = guestRide.data.ride

// A guest with neither email nor phone must be rejected.
const noContact = await post('/rides', {
  pickup: { address: 'A', coords: { lat: 6.5058, lng: 3.3799 } },
  dropoff: { address: 'B', coords: { lat: 6.4414, lng: 3.4705 } },
  rideType: 'standard',
})
check('guest without any contact is rejected', noContact.status === 400 && noContact.data.code === 'GUEST_CONTACT_REQUIRED', `status ${noContact.status}`)

// A signed-in customer is unaffected.
const custReg = await post('/auth/register', {
  name: 'HTTP Check Customer',
  email: `check.cust.${stamp}@swifty.com`,
  password: 'Passw0rd!23',
  phone: '08093334444',
  role: 'customer',
})
check('customer registers without googleId', custReg.status === 201, `status ${custReg.status}`)
const custToken = custReg.data.accessToken

const custRide = await post(
  '/rides',
  {
    pickup: { address: 'Allen Avenue, Ikeja', coords: { lat: 6.6018, lng: 3.3515 } },
    dropoff: { address: 'Ajah Roundabout, Lagos', coords: { lat: 6.4677, lng: 3.5875 } },
    rideType: 'standard',
    paymentMethod: 'cash',
  },
  custToken,
)
check('signed-in customer can still book', custRide.status === 201 && custRide.data.ride?._id, `status ${custRide.status}`)

// 3. The rider's job list must include the guest's ride.
const jobs = await get('/riders/jobs', riderToken)
const visible = (jobs.data.jobs || []).some((j) => j.trackingId === ride.trackingId)
check('guest ride appears in the rider job list', visible, `${jobs.data.jobs?.length} jobs returned`)

// 4. The rider accepts it (the rider accept route is a PATCH).
const accept = await patch(`/riders/jobs/${ride._id}/accept`, null, riderToken)
check('rider accepts the guest ride', accept.status === 200 && accept.data.job?.riderName, `status ${accept.status} ${JSON.stringify(accept.data).slice(0, 140)}`)
check('order moves to accepted', accept.data.job?.status === 'accepted')
check('a real rider is attached', Boolean(accept.data.job?.rider?.name) && accept.data.job?.riderName === riderReg.data.user.name, `rider=${accept.data.job?.riderName}`)

// 5. The guest can follow it publicly — the only thing an anonymous customer
//    may read, and what the client polls while waiting for a driver.
const tracked = await get(`/tracking/public/${ride.trackingId}`)
check('guest can read public tracking for their ride', tracked.status === 200 && tracked.data.tracking?.riderName, `status ${tracked.status}`)

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
