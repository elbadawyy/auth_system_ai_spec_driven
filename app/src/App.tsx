import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ServiceUnavailableModal } from './components/ServiceUnavailableModal'
import { useBackendHealthGate } from './hooks/useBackendHealthGate'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { SignupPage } from './pages/SignupPage'
import './App.css'

function App() {
  const isUnavailable = useBackendHealthGate()

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ServiceUnavailableModal open={isUnavailable} />
    </div>
  )
}

export default App
