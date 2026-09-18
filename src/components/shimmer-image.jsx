import { useState } from 'react'
import { useDelayedLoading } from '@/lib/use-delayed-loading'

/**
 * Drop-in replacement for <img> that shows a shimmer placeholder while the
 * image is loading — but only once loading has taken a moment, so cached
 * or fast images never flash a skeleton first.
 */
export function ShimmerImage({ src, alt = '', className = '', imgClassName = '', ...rest }) {
  const [loaded, setLoaded] = useState(false)
  const showShimmer = useDelayedLoading(Boolean(src) && !loaded)

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {showShimmer && (
        <span className="absolute inset-0 animate-pulse bg-slate-200" />
      )}
      {src && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`${imgClassName} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          {...rest}
        />
      )}
    </span>
  )
}
