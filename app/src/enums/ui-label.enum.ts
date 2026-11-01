export const UiLabel = {
  APP_NAME: 'Auth System',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  SIGN_UP: 'Sign Up',
  SIGN_IN: 'Sign In',
  WELCOME_HEADING: 'Welcome to the application.',
  EMAIL: 'Email',
  NAME: 'Name',
  PASSWORD: 'Password',
  SUBMIT_SIGNUP: 'Create account',
  SUBMITTING_SIGNUP: 'Creating account…',
  SUBMIT_SIGNIN: 'Sign in',
  SUBMITTING_SIGNIN: 'Signing in…',
} as const

export type UiLabel = (typeof UiLabel)[keyof typeof UiLabel]
