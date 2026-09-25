import { useEffect, useRef, useState } from 'react'

// A full simulated "drive" takes this long regardless of real distance —
// long enough to read as a real trip, short enough nobody sits around
// waiting to see it for a demo.
const TRANSIT_DURATION_MS = 45000

function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Returns { position, progress, arrived } for a delivery's courier marker.
 *
 * - Before/after transit: passes through the server's `courierPosition`
 *   unchanged (pickup while accepted/picked_up, dropoff once delivered).
 * - During `in_transit`: interpolates from pickup to dropoff over
 *   TRANSIT_DURATION_MS, anchored to the server's `in_transit` timestamp so
 *   a page refresh (or a second viewer — the customer and the rider both
 *   watching the same trip) resumes from the correct point instead of
 *   restarting the animation.
 * - `arrived` flips true once the simulated drive reaches the dropoff —
 *   that's what gates the rider's "Mark delivered" button.
 */
export function useSimulatedCourierPosition(delivery) {
  const [tick, setTick] = useState(0)
  const frameRef = useRef(null)

  const inTransit = delivery?.status === 'in_transit'
  const startedAtRaw = delivery?.statusTimestamps?.in_transit
  const pickup = delivery?.pickup?.coords
  const dropoff = delivery?.dropoff?.coords

  useEffect(() => {
    if (!inTransit || !pickup || !dropoff) return undefined
    function loop() {
      setTick((t) => t + 1)
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTransit, delivery?.id, pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng])

  if (!delivery) return { position: null, progress: 0, arrived: false }

  if (!inTransit || !pickup || !dropoff) {
    return {
      position: delivery.courierPosition || null,
      progress: delivery.status === 'delivered' ? 1 : 0,
      arrived: delivery.status === 'delivered',
    }
  }

  const startedAt = startedAtRaw ? new Date(startedAtRaw).getTime() : Date.now()
  const elapsed = Date.now() - startedAt
  const progress = Math.min(1, Math.max(0, elapsed / TRANSIT_DURATION_MS))
  void tick // re-render clock — the value itself isn't used, only the render it triggers

  return {
    position: { lat: lerp(pickup.lat, dropoff.lat, progress), lng: lerp(pickup.lng, dropoff.lng, progress) },
    progress,
    arrived: progress >= 1,
  }
}
