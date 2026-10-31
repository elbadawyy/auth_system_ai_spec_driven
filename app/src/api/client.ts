const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function getApiBaseUrl(): string {
  return API_URL.replace(/\/$/, '')
}

export async function apiGet<T>(path: string): Promise<T> {
  const normalizedPath =
    path === '' || path === '/'
      ? '/'
      : path.startsWith('/')
        ? path
        : `/${path}`

  const response = await fetch(`${getApiBaseUrl()}${normalizedPath}`)

  if (!response.ok) {
    throw new Error(`API responded with ${response.status}`)
  }

  return (await response.json()) as T
}
