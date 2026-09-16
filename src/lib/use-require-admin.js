import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from './mock-store'
import { getMe } from '@/services/api'

export function useRequireAdmin() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getCurrentUser())
  const [checking, setChecking] = useState(() => Boolean(sessionStorage.getItem('swifty_access_token')))

  useEffect(() => {
    let cancelled = false
    const token = sessionStorage.getItem('swifty_access_token')

    if (token) {
      setChecking(true)
      getMe()
        .then((serverUser) => {
          if (!cancelled) setUser(serverUser)
        })
        .catch(() => {
          if (cancelled) return
          sessionStorage.removeItem('swifty_access_token')
          setUser(null)
          navigate('/auth', { replace: true, state: { from: '/admin' } })
        })
        .finally(() => {
          if (!cancelled) setChecking(false)
        })
      return
    }

    if (!user || user.role !== 'admin') {
      navigate('/auth', { replace: true, state: { from: '/admin' } })
    }
  }, [user, navigate])

  if (checking) {
    return React.createElement(
      'div',
      { className: 'flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500' },
      'Loading your Swifty account...',
    )
  }
  if (!user || user.role !== 'admin') return null
  return user
}
