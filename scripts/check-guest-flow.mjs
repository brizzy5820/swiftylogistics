// Ad-hoc verification: a guest-created order must appear in a rider's job list
// and be acceptable. Run with: node scripts/check-guest-flow.mjs
import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../server/src/config/db.js'
import User from '../server/src/models/User.js'
import Delivery from '../server/src/models/Delivery.js'

await connectDB()

const counts = await User.aggregate([
  { $group: { _id: { role: '$role', hasGoogle: { $gt: ['$googleId', null] } }, n: { $sum: 1 } } },
])
console.log('user counts by role / has-googleId:', JSON.stringify(counts))

const nullGoogle = await User.countDocuments({ googleId: null })
console.log('users with googleId === null:', nullGoogle)

let idx = []
try { idx = await User.collection.indexes() } catch (e) { console.log('indexes err', e.message) }
console.log('user indexes:', JSON.stringify(idx.map((i) => ({ name: i.name, key: i.key, sparse: !!i.sparse, unique: !!i.unique }))))

const stamp = Date.now().toString(36)
const riderEmail = `check.rider.${stamp}@swifty.com`
// No googleId at all — the ordinary registration path. This used to fail with
// E11000 on googleId_1 (reported as "email already exists").
const rider = await User.create({
  name: 'Check Rider',
  email: riderEmail,
  passwordHash: 'irrelevant-for-this-check',
  phone: '08090000000',
  role: 'rider',
})
console.log('rider created without googleId:', rider.email)

const pendingBefore = await Delivery.countDocuments({ status: 'pending', rider: null })
console.log('pending jobs a rider sees BEFORE:', pendingBefore)

// Mirror what the guest endpoint produces (customer: null).
const guestOrder = await Delivery.create({
  customer: null,
  type: 'ride',
  pickup: { address: 'Pickup A', coords: { lat: 6.5, lng: 3.37 } },
  dropoff: { address: 'Dropoff B', coords: { lat: 6.44, lng: 3.47 } },
  rideType: 'standard',
  price: 2500,
  distanceKm: 12,
  etaMinutes: 40,
  status: 'pending',
  trackingId: `RIDE-CHECK${stamp.toUpperCase()}`,
  guestEmail: `check.guest.${stamp}@swifty.com`,
  guestPhone: '08012345678',
})

// Exactly the query getRiderJobs() runs.
const jobs = await Delivery.find({
  $or: [{ rider: rider._id }, { status: 'pending', rider: null }],
}).sort({ createdAt: -1 })

console.log('jobs returned to rider:', jobs.length)
console.log('guest order visible to rider:', jobs.some((j) => String(j._id) === String(guestOrder._id)))

// Exactly the query acceptDelivery() runs.
const accepted = await Delivery.findOne({ _id: guestOrder._id, status: 'pending', rider: null })
console.log('accept query finds guest order:', Boolean(accepted))

if (accepted) {
  accepted.rider = rider._id
  accepted.riderName = rider.name
  accepted.status = 'accepted'
  accepted.courierPosition = accepted.pickup.coords
  await accepted.save()
  console.log('guest order accepted by real rider:', accepted.status, '| rider:', accepted.riderName)
}

// Clean up so this can be re-run.
await Delivery.deleteOne({ _id: guestOrder._id })
await User.deleteOne({ _id: rider._id })
console.log('cleanup done')

await mongoose.connection.close()
