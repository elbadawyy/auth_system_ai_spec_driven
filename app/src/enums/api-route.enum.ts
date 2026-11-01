export const ApiRoute = {
  HEALTH: 'health',
  USERS_SIGNUP: 'users/signup',
  USERS_SIGNIN: 'users/signin',
  USERS_ME: 'users/me',
} as const

export type ApiRoute = (typeof ApiRoute)[keyof typeof ApiRoute]
