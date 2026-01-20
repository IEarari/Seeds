import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function ProtectedRoute({ children, roles = null }) {
  const { loading, userDocLoading, authUser, role } = useAuth()

  if (loading || (authUser && userDocLoading)) {
    return (
      <div className="container">
        <div className="card">جاري التحميل...</div>
      </div>
    )
  }

  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  if (Array.isArray(roles) && roles.length && !role) {
    return (
      <div className="container">
        <div className="card">جاري التحميل...</div>
      </div>
    )
  }

  if (Array.isArray(roles) && roles.length) {
    if (!role) return <Navigate to="/" replace />
    if (!roles.includes(role)) return <Navigate to="/" replace />
  }

  return children
}
