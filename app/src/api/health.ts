import { ApiRoute } from '../enums/api-route.enum'
import { HealthStatus } from '../enums/health-status.enum'
import { apiGet } from './client'

export interface HealthResponse {
  status: HealthStatus
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const data = await apiGet<HealthResponse>(ApiRoute.HEALTH)
    return data.status === HealthStatus.OK
  } catch {
    return false
  }
}
