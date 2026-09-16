import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ensureSession } from './api-store'

export function useRequireAuth(requiredRole) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    ensureSession().then((currentUser) => {
      if (!active) return
      if (!currentUser) {
        navigate('/auth', { replace: true, state: { from: location.pathname + location.search, intent: location.state ?? null, role: requiredRole } })
        return
      }
      if (requiredRole && currentUser.role !== requiredRole) {
        navigate(currentUser.role === 'admin' ? '/admin' : currentUser.role === 'rider' ? '/rider' : '/customer', { replace: true })
        return
      }
      setUser(currentUser)
      setChecking(false)
    }).catch(() => { if (active) navigate('/auth', { replace: true }) })
    return () => { active = false }
  }, [navigate, requiredRole, location.pathname])

  return checking ? null : user
}
