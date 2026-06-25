import PQueue from "p-queue"

export interface RateLimiter {
  schedule<T>(fn: () => Promise<T>): Promise<T>
}

export class InProcessRateLimiter implements RateLimiter {
  // Dev key limits: 20 req/s, 100 req/2min
  private readonly perSecondQueue = new PQueue({ interval: 1_000, intervalCap: 18 })
  private readonly per2MinQueue = new PQueue({ interval: 120_000, intervalCap: 95 })

  schedule<T>(fn: () => Promise<T>): Promise<T> {
    return this.per2MinQueue.add(() => this.perSecondQueue.add(fn)) as Promise<T>
  }
}

export const defaultRateLimiter: RateLimiter = new InProcessRateLimiter()
