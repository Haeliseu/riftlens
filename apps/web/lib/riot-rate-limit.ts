import { defaultRateLimiter, type RateLimiter } from "@riftlens/riot-api"
import { Redis } from "@upstash/redis"

// Dev key budget: 18 req/s, 95 req/2min. The in-process limiter (defaultRateLimiter)
// smooths bursts *within one instance*; on Vercel each instance has its own, so
// the global budget isn't enforced across instances. These distributed fixed-window
// counters bound the GLOBAL budget across all instances.
//
// OFF by default: only active when RIOT_DISTRIBUTED_LIMIT=1 and Upstash is set,
// so the default runtime behavior is unchanged. ⚠️ The distributed path is not
// runtime-verified here — validate against a real Upstash before enabling.
const PER_SEC = 18
const PER_2MIN = 95
const MAX_ATTEMPTS = 50

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function incrWithTtl(redis: Redis, key: string, ttlSeconds: number): Promise<number> {
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, ttlSeconds)
  return count
}

/** Wait until both the per-second and per-2-minute global windows have room. */
async function acquire(redis: Redis): Promise<void> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const now = Date.now()
    const [perSec, per2Min] = await Promise.all([
      incrWithTtl(redis, `riot:rl:s:${Math.floor(now / 1000)}`, 2),
      incrWithTtl(redis, `riot:rl:m:${Math.floor(now / 120_000)}`, 121),
    ])
    if (perSec <= PER_SEC && per2Min <= PER_2MIN) return
    // Over budget — wait for the tighter window to roll over. Over-counting only
    // makes us back off earlier, which stays under Riot's limit (safe direction).
    await sleep(perSec > PER_SEC ? 1000 - (now % 1000) + 5 : 250)
  }
}

/**
 * Riot rate limiter: distributed global budget (Redis) composed with the
 * in-process limiter for local smoothing. Falls back to the in-process limiter
 * when distributed limiting isn't enabled/configured.
 */
export function createRiotRateLimiter(): RateLimiter {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (process.env.RIOT_DISTRIBUTED_LIMIT !== "1" || !url || !token) {
    return defaultRateLimiter
  }
  const redis = new Redis({ url, token })
  return {
    schedule: (fn) =>
      defaultRateLimiter.schedule(async () => {
        await acquire(redis).catch(() => {}) // never let limiter errors drop a request
        return fn()
      }),
  }
}
