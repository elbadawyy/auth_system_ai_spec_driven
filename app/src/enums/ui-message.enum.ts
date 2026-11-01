export const UiMessage = {
  SERVICE_UNAVAILABLE:
    'Service temporarily unavailable. Please try again later.',
} as const

export type UiMessage = (typeof UiMessage)[keyof typeof UiMessage]
