import { useEffect, useState } from 'react'
import { useDelayedLoading } from '@/lib/use-delayed-loading'

/**
 * Drop-in replacement for <img> that shows a shimmer placeholder while the
 * image is loading — but only once loading has taken a moment, so cached
 * or fast images never flash a skeleton first — and falls back to
 * `fallback` (an icon, initials, whatever) when there's no src at all, or
 * the src fails to load (e.g. a Google account with no profile photo, or a
 * photo URL that's gone stale/403s). Without this, a broken src just left
 * the browser's broken-image glyph on screen instead of a placeholder.
 */
export function ShimmerImage({ src, alt = '', className = '', imgClassName = '', fallback = null, ...rest }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const showShimmer = useDelayedLoading(Boolean(src) && !loaded && !errored)

  // Reset when the image source itself changes (e.g. switching accounts,
  // or a fresh upload replacing a previously-broken one).
  useEffect(() => {
    setLoaded(false)
    setErrored(false)
  }, [src])

  const showFallback = !src || errored

  return (
    <span className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      {showShimmer && (
        <span className="absolute inset-0 animate-pulse bg-slate-200" />
      )}
      {showFallback ? (
        fallback
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`${imgClassName} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          {...rest}
        />
      )}
    </span>
  )
}
