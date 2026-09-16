import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser } from './mock-store'
import { getMe } from '@/services/api'

export function useRequireAuth(requiredRole) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => getCurrentUser())
  const [checking, setChecking] = useState(() => Boolean(sessionStorage.getItem('swifty_access_token')))

  useEffect(() => {
    let cancelled = false
    const token = sessionStorage.getItem('swifty_access_token')

    if (token) {
      setChecking(true)
      getMe()
        .then((serverUser) => {
          if (cancelled) return
          if (requiredRole && serverUser.role !== requiredRole) {
            navigate(serverUser.role === 'rider' ? '/rider' : serverUser.role === 'admin' ? '/admin' : '/customer', { replace: true })
            return
          }
          setUser(serverUser)
        })
        .catch(() => {
          if (cancelled) return
          sessionStorage.removeItem('swifty_access_token')
          setUser(null)
          navigate('/auth', { replace: true, state: { from: location.pathname + location.search, role: requiredRole } })
        })
        .finally(() => {
          if (!cancelled) setChecking(false)
        })
      return
    }

    const u = getCurrentUser()
    if (!u) {
      navigate('/auth', {
        replace: true,
        state: {
          from: location.pathname + location.search,
          intent: location.state ?? null,
          role: requiredRole,
        },
      })
      return
    }
    if (requiredRole && u.role !== requiredRole) {
      navigate(u.role === 'rider' ? '/rider' : u.role === 'admin' ? '/admin' : '/customer', { replace: true })
      return
    }
    setUser(u)
  }, [navigate, requiredRole, location])

  if (checking) {
    return React.createElement(
      'div',
      { className: 'flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500' },
      'Loading your Swifty account...',
    )
  }
  return user
}
