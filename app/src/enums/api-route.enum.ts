export const ApiRoute = {
  HEALTH: 'health',
  USERS_SIGNUP: 'users/signup',
} as const

export type ApiRoute = (typeof ApiRoute)[keyof typeof ApiRoute]
