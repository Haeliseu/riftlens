import { RiotApiError } from "./errors"

export interface RetryOptions {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
}

const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs } = { ...DEFAULT_RETRY, ...options }

  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err

      if (!(err instanceof RiotApiError) || !err.isRetryable) throw err
      if (attempt === maxAttempts) throw err

      const retryAfter = err.isRateLimit ? err.retryAfterSeconds : null
      const delay = retryAfter
        ? retryAfter * 1000
        : Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs)

      await sleep(delay)
    }
  }
  throw lastError
}
