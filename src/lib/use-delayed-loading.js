import { useEffect, useState } from 'react'

/**
 * Returns true only once `isLoading` has stayed true for at least
 * `delayMs`. Use this to gate skeleton/shimmer loaders so they don't flash
 * on fast (cached or near-instant) responses — the loader only appears
 * once a fetch is genuinely slow.
 *
 *   const showSkeleton = useDelayedLoading(isLoading)
 */
export function useDelayedLoading(isLoading, delayMs = 400) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShow(false)
      return
    }
    const timeout = window.setTimeout(() => setShow(true), delayMs)
    return () => window.clearTimeout(timeout)
  }, [isLoading, delayMs])

  return show
}
