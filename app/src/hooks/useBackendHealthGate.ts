import { useEffect, useState } from 'react'
import { checkBackendHealth } from '../api/health'
import { HealthPoll } from '../enums/health-poll.enum'

export function useBackendHealthGate(): boolean {
  const [isUnavailable, setIsUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    let retryTimeoutId: ReturnType<typeof setTimeout> | undefined
    let inFlight = false

    async function runHealthCheck(): Promise<boolean> {
      if (inFlight) {
        return false
      }

      inFlight = true
      try {
        return await checkBackendHealth()
      } finally {
        inFlight = false
      }
    }

    function scheduleRetry(): void {
      retryTimeoutId = setTimeout(() => {
        void (async () => {
          const isHealthy = await runHealthCheck()
          if (cancelled) {
            return
          }

          if (isHealthy) {
            setIsUnavailable(false)
            return
          }

          scheduleRetry()
        })()
      }, HealthPoll.INTERVAL_MS)
    }

    void (async () => {
      const isHealthy = await runHealthCheck()
      if (cancelled) {
        return
      }

      if (!isHealthy) {
        setIsUnavailable(true)
        scheduleRetry()
      }
    })()

    return () => {
      cancelled = true
      if (retryTimeoutId !== undefined) {
        clearTimeout(retryTimeoutId)
      }
    }
  }, [])

  return isUnavailable
}
