import { describe, expect, it } from 'vitest'
import { createTestJwt } from '../test/jwt-test-utils'
import { isAccessTokenValid } from './jwt'

describe('isAccessTokenValid', () => {
  it('returns true for a token with future exp', () => {
    const token = createTestJwt(Math.floor(Date.now() / 1000) + 3600)
    expect(isAccessTokenValid(token)).toBe(true)
  })

  it('returns false for an expired token', () => {
    const token = createTestJwt(Math.floor(Date.now() / 1000) - 10)
    expect(isAccessTokenValid(token)).toBe(false)
  })

  it('returns false for malformed tokens', () => {
    expect(isAccessTokenValid('')).toBe(false)
    expect(isAccessTokenValid('not-a-jwt')).toBe(false)
    expect(isAccessTokenValid('a.b')).toBe(false)
    expect(isAccessTokenValid('a.!!! .c')).toBe(false)
  })
})
