const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function getApiBaseUrl(): string {
  return API_URL.replace(/\/$/, '')
}

function normalizePath(path: string): string {
  if (path === '' || path === '/') {
    return '/'
  }
  return path.startsWith('/') ? path : `/${path}`
}

export interface ApiErrorBody {
  statusCode: number
  errorCode: string
  message: string | string[]
  path: string
  timestamp: string
}

export class ApiRequestError extends Error {
  readonly statusCode: number
  readonly errorCode: string | undefined
  readonly messages: string | string[]

  constructor(
    statusCode: number,
    messages: string | string[],
    errorCode?: string,
  ) {
    const summary = Array.isArray(messages) ? messages.join(', ') : messages
    super(summary)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.messages = messages
  }
}

async function parseErrorBody(
  response: Response,
): Promise<ApiErrorBody | null> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>
    if (
      typeof body.statusCode === 'number' &&
      (typeof body.message === 'string' || Array.isArray(body.message))
    ) {
      return {
        statusCode: body.statusCode,
        errorCode:
          typeof body.errorCode === 'string' ? body.errorCode : 'UNKNOWN',
        message: body.message,
        path: typeof body.path === 'string' ? body.path : '',
        timestamp:
          typeof body.timestamp === 'string'
            ? body.timestamp
            : new Date().toISOString(),
      }
    }
    return null
  } catch {
    return null
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${normalizePath(path)}`)

  if (!response.ok) {
    throw new Error(`API responded with ${response.status}`)
  }

  return (await response.json()) as T
}

export async function apiPost<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${normalizePath(path)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await parseErrorBody(response)
    if (errorBody) {
      throw new ApiRequestError(
        errorBody.statusCode,
        errorBody.message,
        errorBody.errorCode,
      )
    }
    throw new ApiRequestError(
      response.status,
      `API responded with ${response.status}`,
    )
  }

  return (await response.json()) as T
}
