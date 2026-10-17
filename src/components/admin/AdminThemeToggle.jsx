import { useEffect } from 'react'
import { useTheme } from '../theme-provider'

export function useAdminTheme(rootRef) {
  const { setTheme: setAppTheme } = useTheme()

  useEffect(() => {
    const root = window.document.documentElement
    const el = rootRef?.current || root
    root.classList.remove('dark')
    root.classList.add('light')
    root.setAttribute('data-theme', 'light')
    root.style.colorScheme = 'light'
    el.classList.remove('admin-dark', 'dark')
  }, [rootRef])

  return {
    theme: 'light',
    resolvedTheme: 'light',
    setTheme: () => setAppTheme('light'),
  }
}

export function AdminThemeToggle() {
  return null
}

export function AdminThemeSelector() {
  return null
}
