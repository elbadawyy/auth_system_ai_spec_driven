export const HttpStatusCode = {
  OK: 200,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
} as const

export type HttpStatusCode =
  (typeof HttpStatusCode)[keyof typeof HttpStatusCode]
