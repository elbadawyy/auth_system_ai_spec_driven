export const ApiRoute = {
  HEALTH: 'health',
} as const

export type ApiRoute = (typeof ApiRoute)[keyof typeof ApiRoute]
