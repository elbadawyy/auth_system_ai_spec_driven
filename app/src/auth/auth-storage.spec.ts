import { afterEach, describe, expect, it } from 'vitest'
import {
  AuthStorageKey,
  clearAuthStorage,
  readAuthSession,
  saveAuthSession,
} from './auth-storage'
import { createTestJwt } from '../test/jwt-test-utils'

const user = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Ada Lovelace',
}

afterEach(() => {
  clearAuthStorage()
})

describe('auth-storage', () => {
  it('saves and reads a valid session', () => {
    const accessToken = createTestJwt(Math.floor(Date.now() / 1000) + 3600)
    saveAuthSession({ accessToken, user })

    expect(readAuthSession()).toEqual({ accessToken, user })
    expect(localStorage.getItem(AuthStorageKey.ACCESS_TOKEN)).toBe(accessToken)
  })

  it('clears storage when token is expired', () => {
    const accessToken = createTestJwt(Math.floor(Date.now() / 1000) - 5)
    localStorage.setItem(AuthStorageKey.ACCESS_TOKEN, accessToken)
    localStorage.setItem(AuthStorageKey.USER, JSON.stringify(user))

    expect(readAuthSession()).toBeNull()
    expect(localStorage.getItem(AuthStorageKey.ACCESS_TOKEN)).toBeNull()
  })

  it('clears storage when user JSON is invalid', () => {
    const accessToken = createTestJwt(Math.floor(Date.now() / 1000) + 3600)
    localStorage.setItem(AuthStorageKey.ACCESS_TOKEN, accessToken)
    localStorage.setItem(AuthStorageKey.USER, '{not-json')

    expect(readAuthSession()).toBeNull()
  })
})
