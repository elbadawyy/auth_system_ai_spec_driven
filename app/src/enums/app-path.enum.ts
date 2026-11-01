export const AppPath = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/signup',
  PROFILE: '/profile',
} as const

export type AppPath = (typeof AppPath)[keyof typeof AppPath]
