import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from './mock-store'

// Redirects to /auth if the current user is not an admin.
export function useRequireAdmin() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  useEffect(() => {
    if ( user.role !== 'admin') {
      navigate('/auth', { replace: true, state: { from: '/admin' } })
    }
  }, [user, navigate])
  if (!user || user.role !== 'admin') return null
  return user
}
