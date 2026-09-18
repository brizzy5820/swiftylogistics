import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensureSession } from './api-store'

export function useRequireAdmin() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    ensureSession().then((currentUser) => {
      if (!active) return
      if (!currentUser || currentUser.role !== 'admin') {
        navigate('/auth', { replace: true, state: { from: '/admin' } })
        return
      }
      setUser(currentUser)
      setChecking(false)
    }).catch(() => { if (active) navigate('/auth', { replace: true }) })
    return () => { active = false }
  }, [navigate])

  return checking ? null : user
}
