import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/useAuth'

export function ProtectedRoute() {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
