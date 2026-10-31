export const ApiRoute = {
  ROOT: '',
  HEALTH: 'health',
} as const

export type ApiRoute = (typeof ApiRoute)[keyof typeof ApiRoute]
