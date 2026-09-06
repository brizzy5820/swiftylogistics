// Creative Swifty wordmark + a small lightning-bolt mark.
// Used across the customer, rider, and admin headers/footers.
export function SwiftyLogo({ variant = 'dark', className = '', showMark = true }) {
  const text = variant === 'light' ? 'text-white' : 'text-slate-900'
  const dot = 'text-emerald-500'
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showMark && (
        <span className="relative flex h-7 w-7 items-center justify-center">
          <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
            <defs>
              <linearGradient id="swifty-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="28" height="28" rx="8" fill="url(#swifty-grad)" />
            <path
              d="M16.5 5 L8 16 H13 L11.5 23 L20 12 H15 L16.5 5 Z"
              fill="white"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <span className={`font-display text-xl font-black tracking-tight ${text}`}>
        <span className="lowercase">s</span>wifty<span className={dot}>.</span>
      </span>
    </span>
  )
}
