import { ApiRoute } from '../enums/api-route.enum'
import { apiGet } from './client'

export interface HelloResponse {
  message: string
}

export async function fetchHelloMessage(): Promise<string> {
  const data = await apiGet<HelloResponse>(ApiRoute.ROOT)
  return data.message
}
