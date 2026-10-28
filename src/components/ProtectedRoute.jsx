import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ allowedRole }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user?.role !== allowedRole) {
    // If admin is trying to view customer route or vice versa
    if (user?.role === 'ROLE_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />
    } else {
      return <Navigate to="/customer/dashboard" replace />
    }
  }

  return <Outlet />
}
