interface JwtPayload {
  exp?: unknown
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding =
    normalized.length % 4 === 0
      ? ''
      : '='.repeat(4 - (normalized.length % 4))
  return atob(`${normalized}${padding}`)
}

export function isAccessTokenValid(token: string): boolean {
  if (!token) {
    return false
  }

  const parts = token.split('.')
  if (parts.length < 2) {
    return false
  }

  try {
    const payloadJson = decodeBase64Url(parts[1] ?? '')
    const payload = JSON.parse(payloadJson) as JwtPayload
    if (typeof payload.exp !== 'number') {
      return false
    }
    const nowSeconds = Math.floor(Date.now() / 1000)
    return payload.exp > nowSeconds
  } catch {
    return false
  }
}
