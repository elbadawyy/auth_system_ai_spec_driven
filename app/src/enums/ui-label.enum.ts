export const UiLabel = {
  APP_NAME: 'Auth System',
  LOGIN: 'Login',
  WELCOME_HEADING: 'Welcome to the application.',
} as const

export type UiLabel = (typeof UiLabel)[keyof typeof UiLabel]
