import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ensureSession, useStore } from './api-store'

export function useRequireAuth(requiredRole) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const session = useStore((s) => s.session)
  const loading = useStore((s) => s.loading)

  useEffect(() => {
    let active = true
    
    const checkAuth = async () => {
      if (loading && !session) {
        // Wait for hydration to complete
        return
      }
      
      const currentUser = await ensureSession()
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
    }
    
    checkAuth()
    
    return () => { active = false }
  }, [navigate, requiredRole, location.pathname, session, loading])

  return checking ? null : user
}
