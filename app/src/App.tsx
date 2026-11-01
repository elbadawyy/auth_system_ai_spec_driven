import { Navigate, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthenticated } from './auth/RedirectIfAuthenticated'
import { RequireAuth } from './auth/RequireAuth'
import { Navbar } from './components/Navbar'
import { ServiceUnavailableModal } from './components/ServiceUnavailableModal'
import { AppPath } from './enums/app-path.enum'
import { useBackendHealthGate } from './hooks/useBackendHealthGate'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { SignInPage } from './pages/SignInPage'
import { SignupPage } from './pages/SignupPage'
import './App.css'

function App() {
  const isUnavailable = useBackendHealthGate()

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path={AppPath.HOME} element={<HomePage />} />
          <Route element={<RedirectIfAuthenticated />}>
            <Route path={AppPath.SIGN_IN} element={<SignInPage />} />
            <Route path={AppPath.SIGN_UP} element={<SignupPage />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route path={AppPath.PROFILE} element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to={AppPath.HOME} replace />} />
        </Routes>
      </main>
      <ServiceUnavailableModal open={isUnavailable} />
    </div>
  )
}

export default App
