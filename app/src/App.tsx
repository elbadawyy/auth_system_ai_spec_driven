import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function App() {
  const [message, setMessage] = useState<string>('Loading...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`API responded with ${response.status}`)
        }
        const data = (await response.json()) as { message: string }
        setMessage(data.message)
      })
      .catch((err: unknown) => {
        const text =
          err instanceof Error ? err.message : 'Failed to reach the API'
        setError(text)
        setMessage('')
      })
  }, [])

  return (
    <main className="page">
      <h1>Auth System</h1>
      {error ? (
        <p className="error">Could not load message: {error}</p>
      ) : (
        <p className="message">{message}</p>
      )}
    </main>
  )
}

export default App
