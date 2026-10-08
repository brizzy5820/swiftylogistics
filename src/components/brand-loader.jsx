import { useEffect, useState } from 'react'
import { BRAND } from '@/config/brand'

/** The Swifty mark — a bolt inside a rounded square. */
export function BrandMark({ className = 'h-14 w-14' }) {
  return (
   <img src="/logonobg.png" alt="Swifty Logo" className={className} />
  )
}

/**
 * Full-screen blinking logo shown while a page or request is in flight.
 * It waits `delay` ms before appearing, so fast (cached) loads never flash it,
 * and it unmounts the instant content is ready.
 */
export function BrandLoader({ delay = 150, label = 'Loading' }) {
  const [visible, setVisible] = useState(delay === 0)
  useEffect(() => {
    if (delay === 0) return
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  if (!visible) return null
  return (
    <div role="status" aria-live="polite" className="swifty-loader fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-white/85 backdrop-blur-sm">
      <span className="swifty-loader__pulse"><BrandMark /></span>
      <span className="sr-only">{label}</span>
    </div>
  )
}

/**
 * Branded welcome shown once right after sign-in / sign-up while the
 * dashboard warms up. Calls onDone after `duration` ms.
 */
export function BrandEntrance({ name, onDone, duration = 3000}) {
  useEffect(() => {
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [onDone, duration])
  const first = (name || '').split(' ')[0]
  return (
    <div className="swifty-entrance fixed inset-0 z-[110] flex flex-col items-center justify-center bg-[var(--color-brand)]">
      <div className="swifty-entrance__mark"><BrandMark className="h-20 w-20 drop-shadow-xl" /></div>
      <p className="swifty-entrance__name mt-6 font-display text-4xl font-black tracking-tight text-white">{BRAND.name}</p>
       <p className="swifty-entrance__tag mt-2 font-medium font-display text-xl text-white/80">
       Ride without friction
      </p>
      <p className="swifty-entrance__tag2 mt-2 text-sm font-medium text-white/80">
        {first ? `Welcome, ${first}` : BRAND.tagline}
      </p>
      <span className="swifty-entrance__bar mt-8 h-1 w-24 overflow-hidden rounded-full bg-white/25"><i /></span>
    </div>
  )
}
