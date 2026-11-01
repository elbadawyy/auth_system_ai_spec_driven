import { Navbar } from './components/Navbar'
import { ServiceUnavailableModal } from './components/ServiceUnavailableModal'
import { UiLabel } from './enums/ui-label.enum'
import { useBackendHealthGate } from './hooks/useBackendHealthGate'
import './App.css'

function App() {
  const isUnavailable = useBackendHealthGate()

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <h1 className="app-welcome">{UiLabel.WELCOME_HEADING}</h1>
      </main>
      <ServiceUnavailableModal open={isUnavailable} />
    </div>
  )
}

export default App
