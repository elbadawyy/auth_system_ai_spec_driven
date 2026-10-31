export const UiMessage = {
  LOADING: 'Loading...',
  BACKEND_DOWN: 'Backend is unavailable. Please try again later.',
  HEALTH_FAILED: 'Health check failed',
  HELLO_FAILED: 'Could not load message',
} as const

export type UiMessage = (typeof UiMessage)[keyof typeof UiMessage]
