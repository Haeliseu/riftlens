import { Redis } from "@upstash/redis"

/**
 * Upstash Redis cache for Riot API responses — cuts repeated calls (immutable
 * match data especially) so we stay under the dev-key rate limit.
 *
 * Gracefully no-ops when UPSTASH_REDIS_REST_URL / _TOKEN aren't configured, so
 * the app keeps working without Redis (just without the cache).
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

export const cacheEnabled = redis !== null

/**
 * Read-through cache: return the cached value for `key`, else run `fn`, store
 * the result for `ttlSeconds`, and return it. Cache failures never throw — they
 * fall back to calling `fn` directly.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  if (!redis) return fn()
  try {
    const hit = await redis.get<T>(key)
    if (hit !== null && hit !== undefined) return hit
  } catch {
    // cache read failed — fall through to source
  }
  const value = await fn()
  try {
    await redis.set(key, value, { ex: ttlSeconds })
  } catch {
    // cache write failed — non-fatal
  }
  return value
}
