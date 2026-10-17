import React, { useState } from 'react'
import { Sun, Moon, Monitor, Sparkles } from 'lucide-react'
import { useTheme } from './theme-provider'
import { updateCurrentUser } from '@/lib/api-store'

export function FirstTimeThemePrompt({ isOpen, onComplete }) {
  const { theme, setTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState(theme || 'system')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSelect = (t) => {
    setSelectedTheme(t)
    setTheme(t) // Apply immediately
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      setTheme(selectedTheme)
      await updateCurrentUser({ themePreference: selectedTheme })
    } catch (err) {
      console.warn('Could not save theme preference to server:', err)
    } finally {
      setSaving(false)
      onComplete?.(selectedTheme)
    }
  }

  const options = [
    {
      id: 'light',
      label: 'Light mode',
      desc: 'Crisp & clear for bright environments',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark mode',
      desc: 'High contrast & easy on the eyes',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System preference',
      desc: 'Automatically matches your device',
      icon: Monitor,
    },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Choose your theme
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Personalize your Swifty experience. You can change this anytime in Settings.
          </p>
        </div>

        <div className="mt-6 space-y-2.5">
          {options.map((opt) => {
            const Icon = opt.icon
            const isSelected = selectedTheme === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/20 dark:ring-emerald-500/30'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {opt.label}
                    </span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {opt.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-70"
        >
          {saving ? 'Saving preference...' : 'Continue to Swifty'}
        </button>
      </div>
    </div>
  )
}

export default FirstTimeThemePrompt
