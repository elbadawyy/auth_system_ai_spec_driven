export const HealthPoll = {
  INTERVAL_MS: 20_000,
} as const

export type HealthPollIntervalMs = (typeof HealthPoll)['INTERVAL_MS']
