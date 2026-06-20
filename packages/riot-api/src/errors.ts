export class RiotApiError extends Error {
  retryAfterSeconds: number | null = null

  constructor(
    public readonly status: number,
    public readonly endpoint: string,
    message: string
  ) {
    super(message)
    this.name = "RiotApiError"
  }

  get isRateLimit() {
    return this.status === 429
  }
  get isMaintenance() {
    return this.status === 503
  }
  get isNotFound() {
    return this.status === 404
  }
  get isUnauthorized() {
    return this.status === 401 || this.status === 403
  }
  get isRetryable() {
    return this.isRateLimit || this.isMaintenance || this.status >= 500
  }
}
