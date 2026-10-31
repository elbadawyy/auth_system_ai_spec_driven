import { useEffect, useState } from 'react'
import { checkBackendHealth } from './api/health'
import { fetchHelloMessage } from './api/hello'
import { UiMessage } from './enums/ui-message.enum'
import './App.css'

function App() {
  const [message, setMessage] = useState<string>(UiMessage.LOADING)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const isHealthy = await checkBackendHealth()
      if (cancelled) {
        return
      }

      if (!isHealthy) {
        setError(UiMessage.BACKEND_DOWN)
        setMessage('')
        return
      }

      try {
        const hello = await fetchHelloMessage()
        if (!cancelled) {
          setMessage(hello)
          setError(null)
        }
      } catch {
        if (!cancelled) {
          setError(UiMessage.HELLO_FAILED)
          setMessage('')
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="page">
      <h1>Auth System</h1>
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <p className="message">{message}</p>
      )}
    </main>
  )
}

export default App
