import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser } from './mock-store'

export function useRequireAuth(requiredRole) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => getCurrentUser())

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) {
      // Carry the attempted destination + any passed intent (e.g. prefilled
      // pickup/dropoff) so we can return the user exactly where they left off.
      // `role` tells Auth which mode (rider/customer) the user was heading to.
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
      navigate(u.role === 'rider' ? '/rider' : '/customer'||'/admin', { replace: true })
      return
    }
    if(u.role=== 'admin'? '/admin':"/customer" , { replace: true })

    setUser(u)
  }, [navigate, requiredRole, location])

  return user
}
