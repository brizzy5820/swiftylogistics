import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { useStore } from '../lib/api-store'

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const storeTheme = useStore((s) => s.theme)
  const [theme, setTheme] = useState('light')

  // Initialize theme from localStorage or store on mount
  useEffect(() => {
    const stored = localStorage.getItem('swifty_theme')
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored)
    } else if (storeTheme) {
      setTheme(storeTheme)
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(dark ? 'dark' : 'light')
    }
  }, [storeTheme])

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
    // Persist to localStorage immediately
    localStorage.setItem('swifty_theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider