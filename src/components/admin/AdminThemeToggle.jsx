import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

let THEME_KEY = 'swifty-admin-theme'

function getInitial() {
  if (typeof window === 'undefined') return 'dark'
  try {
    return window.localStorage.getItem(THEME_KEY) || 'dark'
  } catch {
    return 'dark' 
  }
}

// Admin-scoped theme. Adds/removes a `.admin-dark` class on the
// provided root ref so dark styles only apply to the admin system.
export function useAdminTheme(rootRef) {
  const [theme, setTheme] = useState(getInitial)
  useEffect(() => {
    const el = rootRef?.current || document.body
    if (theme === 'dark') el.classList.add('admin-dark')
    else el.classList.remove('admin-dark')
    try { window.localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme, rootRef])
  return { theme, setTheme }
}

export function AdminThemeToggle({ theme, setTheme }) {
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10  transition !admin-dark:bg-black/10 admin-dark:text-black  "
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
