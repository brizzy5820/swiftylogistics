import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ensureSession, getCurrentUser } from './api-store'

export function useRequireAdmin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const token = localStorage.getItem('swifty_access_token') || sessionStorage.getItem('swifty_access_token')
    if (!token) return null
    const current = getCurrentUser()
    if (current && (current.role === 'admin' || current.activeMode === 'admin')) {
      return current
    }
    return null
  })
  const [checking, setChecking] = useState(() => !user)

  useEffect(() => {
    let active = true
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('swifty_access_token') || sessionStorage.getItem('swifty_access_token'))
      : null

    if (!token) {
      if (active && !location.pathname.startsWith('/auth')) {
        navigate('/auth?mode=admin', {
          replace: true,
          state: { from: location.pathname + location.search },
        })
      }
      return
    }

    ensureSession()
      .then((currentUser) => {
        if (!active) return
        const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.activeMode === 'admin')
        if (!isAdmin) {
          if (!location.pathname.startsWith('/auth')) {
            navigate('/auth?mode=admin', {
              replace: true,
              state: { from: location.pathname + location.search },
            })
          }
          return
        }
        setUser(currentUser)
        setChecking(false)
      })
      .catch(() => {
        if (active && !location.pathname.startsWith('/auth')) {
          navigate('/auth?mode=admin', {
            replace: true,
            state: { from: location.pathname + location.search },
          })
        }
      })

    return () => {
      active = false
    }
  }, [navigate, location])

  return checking ? null : user
}
