import { Navigate, Outlet } from 'react-router-dom'
import { useSignedIn } from '../context/SignedInContext'
import { AppPath } from '../enums/app-path.enum'

export function RequireAuth() {
  const { isAuthenticated } = useSignedIn()

  if (!isAuthenticated) {
    return <Navigate to={AppPath.SIGN_IN} replace />
  }

  return <Outlet />
}
