import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from './theme-provider'
import { updateCurrentUser } from '@/lib/api-store'

export function ThemeToggle({ className = '', showLabel = true }) {
  const { theme, setTheme } = useTheme()

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  const handleChange = (selected) => {
    setTheme(selected)
    try {
      updateCurrentUser({ themePreference: selected }).catch(() => {})
    } catch {}
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Appearance
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize how Swifty looks on your device.
          </p>
        </div>
      )}
      <div
        role="radiogroup"
        aria-label="Theme selection"
        className="flex max-w-sm rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900"
      >
        {options.map((opt) => {
          const Icon = opt.icon
          const isSelected = theme === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleChange(opt.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all duration-150 ${
                isSelected
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-400 dark:shadow-md'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ThemeToggle
