// Backend boundary. The UI talks to this module, never directly to MongoDB.
// Phase 1 uses mock data. Phase 2 can point API_BASE_URL at the Express server.
import { MOCK_RIDE_OPTIONS, MOCK_RIDES } from '../data/mock-data'

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
export const backendMode = 'mock'

export async function getRideOptions() {
  return MOCK_RIDE_OPTIONS
}

export async function getActiveRides() {
  return MOCK_RIDES.filter((ride) => ride.status !== 'completed')
}

export async function createRide(payload) {
  return {
    id: `SW-R-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'searching',
    ...payload,
    createdAt: Date.now(),
  }
}

export async function createDelivery(payload) {
  // Express/MongoDB integration will replace this implementation.
  return { id: `SW-D-${Date.now().toString(36).toUpperCase()}`, status: 'pending', ...payload, createdAt: Date.now() }
}
