import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { getVolunteeringSettings } from '../services/settings.js'

export default function HomeRedirectByRole() {
  const { role, userDoc } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!role) return

      if (role === 'volunteer') {
        navigate('/dashboard', { replace: true })
        return
      }

      if (['review_admin', 'admin', 'super_admin'].includes(role)) {
        navigate('/admin/review', { replace: true })
        return
      }

      const currentApplicationId = userDoc?.currentApplicationId || null

      if (currentApplicationId) {
        navigate('/status', { replace: true })
        return
      }

      const settings = await getVolunteeringSettings()
      if (cancelled) return

      if (settings.isApplicationOpen) {
        navigate('/application', { replace: true })
      } else {
        navigate('/status', { replace: true })
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [navigate, role, userDoc?.currentApplicationId])

  return (
    <div className="container">
      <div className="card">جاري التحويل...</div>
    </div>
  )
}
