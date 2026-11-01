function toBase64Url(json: string): string {
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function createTestJwt(expSeconds: number): string {
  const header = toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = toBase64Url(
    JSON.stringify({ sub: 'user-1', email: 'user@example.com', exp: expSeconds }),
  )
  return `${header}.${payload}.signature`
}
