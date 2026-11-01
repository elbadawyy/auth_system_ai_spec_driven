import { Navigate, Outlet } from 'react-router-dom'
import { useSignedIn } from '../context/SignedInContext'
import { AppPath } from '../enums/app-path.enum'

export function RedirectIfAuthenticated() {
  const { isAuthenticated } = useSignedIn()

  if (isAuthenticated) {
    return <Navigate to={AppPath.PROFILE} replace />
  }

  return <Outlet />
}
