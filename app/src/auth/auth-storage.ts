import type { AuthUser } from '../api/users'
import { isAccessTokenValid } from './jwt'

export const AuthStorageKey = {
  ACCESS_TOKEN: 'auth.accessToken',
  USER: 'auth.user',
} as const

export type AuthStorageKey =
  (typeof AuthStorageKey)[keyof typeof AuthStorageKey]

export interface StoredAuthSession {
  accessToken: string
  user: AuthUser
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<AuthUser>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.name === 'string'
  )
}

export function clearAuthStorage(): void {
  localStorage.removeItem(AuthStorageKey.ACCESS_TOKEN)
  localStorage.removeItem(AuthStorageKey.USER)
}

export function saveAuthSession(session: StoredAuthSession): void {
  localStorage.setItem(AuthStorageKey.ACCESS_TOKEN, session.accessToken)
  localStorage.setItem(AuthStorageKey.USER, JSON.stringify(session.user))
}

export function readAuthSession(): StoredAuthSession | null {
  const accessToken = localStorage.getItem(AuthStorageKey.ACCESS_TOKEN)
  const userRaw = localStorage.getItem(AuthStorageKey.USER)

  if (!accessToken || !userRaw) {
    clearAuthStorage()
    return null
  }

  if (!isAccessTokenValid(accessToken)) {
    clearAuthStorage()
    return null
  }

  try {
    const parsed: unknown = JSON.parse(userRaw)
    if (!isAuthUser(parsed)) {
      clearAuthStorage()
      return null
    }
    return { accessToken, user: parsed }
  } catch {
    clearAuthStorage()
    return null
  }
}
