import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ensureSession, useStore, getCurrentUser, getGuestUser } from './api-store'

export function useRequireAuth(requiredRole) {
  const navigate = useNavigate()
  const location = useLocation()
  // Fast path: a cached session with the right role renders the page on the
  // very first frame; the server check still runs in the background.
  const hasToken = typeof window !== 'undefined' && !!(localStorage.getItem('swifty_access_token') || sessionStorage.getItem('swifty_access_token'))
  const cached = hasToken ? getCurrentUser() : null
  const guest = !cached && requiredRole === 'customer' ? getGuestUser() : null
  const cachedOk = !!cached && (!requiredRole || cached.role === requiredRole)
  const [user, setUser] = useState(cachedOk ? cached : guest)
  const [checking, setChecking] = useState(!cachedOk && !guest)
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
        // Guest checkout lets an anonymous customer use the customer pages
        // once they have left contact details here. Drivers and admins still
        // need a real account.
        if (requiredRole === 'customer') {
          const guestUser = getGuestUser()
          if (guestUser) {
            setUser(guestUser)
            setChecking(false)
            return
          }
        }
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
