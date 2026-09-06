import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/mock-store'

const SLIDES = [
  {
    title: 'Fast Delivery',
    description:
      'Get your packages delivered quickly with real-time tracking and instant notifications.',
  },
  {
    title: 'Live Tracking',
    description:
      'Track your courier in real-time with precise location updates and estimated arrival times.',
  },
  {
    title: 'Grow Your Business',
    description: 'Join as a courier or seller and start earning. Flexible schedules, great rewards.',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      navigate(user.role === 'rider' ? '/rider' : '/customer', { replace: true })
      return
    }
    if (localStorage.getItem('swifty_onboarding_seen')) {
      navigate('/auth', { replace: true })
    }
  }, [navigate])

  function finish() {
    localStorage.setItem('swifty_onboarding_seen', 'true')
    navigate('/auth')
  }

  function handleNext() {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1)
    } else {
      finish()
    }
  }

  const slide = SLIDES[current]

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-white px-6 py-10">
      <div className="flex w-full items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-sm text-slate-400 hover:text-navy transition-colors">
          <ChevronLeft className="h-4 w-4" /> Home
        </Link>
        <button onClick={finish} className="text-sm text-slate-400 hover:text-slate-600">
          Skip
        </button>
      </div>

      <div className="flex flex-col items-center gap-8 text-center">
        <img src="/logo.png" alt="Swifty & Courier Logo" className="h-40 w-auto object-contain" />
        <div className="max-w-xs">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-navy">{slide.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">{slide.description}</p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={
                i === current
                  ? 'h-2.5 w-6 rounded-full bg-brand transition-all'
                  : 'h-2.5 w-2.5 rounded-full bg-surface-200 transition-all'
              }
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-brand py-4 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
