export const HealthStatus = {
  OK: 'ok',
} as const

export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus]
