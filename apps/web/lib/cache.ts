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
 * Process-local fallback used when Redis isn't configured (e.g. local dev, or a
 * deploy without Upstash). Bounded LRU + TTL so it never grows unbounded. This
 * keeps cache-dependent features working without Upstash — notably the
 * leaderboard's background-filled champions, which are otherwise read-only from
 * cache and would never appear. Note: on serverless it's per-instance and
 * ephemeral, so Upstash is still preferred in production for a shared cache.
 */
const MEM_MAX = 1000
const mem = new Map<string, { value: unknown; expires: number }>()

function memGet<T>(key: string): T | null {
  const e = mem.get(key)
  if (!e) return null
  if (e.expires < Date.now()) {
    mem.delete(key)
    return null
  }
  // Touch for LRU recency.
  mem.delete(key)
  mem.set(key, e)
  return e.value as T
}

function memSet<T>(key: string, value: T, ttlSeconds: number): void {
  if (value === undefined) return
  mem.set(key, { value, expires: Date.now() + ttlSeconds * 1000 })
  if (mem.size > MEM_MAX) {
    const oldest = mem.keys().next().value
    if (oldest !== undefined) mem.delete(oldest)
  }
}

/**
 * Read-through cache: return the cached value for `key`, else run `fn`, store
 * the result for `ttlSeconds`, and return it. Cache failures never throw — they
 * fall back to calling `fn` directly. Uses Redis when configured, else a
 * process-local LRU.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  if (!redis) {
    const hit = memGet<T>(key)
    if (hit !== null) return hit
    const value = await fn()
    memSet(key, value, ttlSeconds)
    return value
  }
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

/** Read a cached value without computing anything (null = miss). */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return memGet<T>(key)
  try {
    return (await redis.get<T>(key)) ?? null
  } catch {
    return null
  }
}

/** Write a value to the cache. */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!redis) {
    memSet(key, value, ttlSeconds)
    return
  }
  try {
    await redis.set(key, value, { ex: ttlSeconds })
  } catch {
    // non-fatal
  }
}
