import { afterEach, describe, expect, it, vi } from "vitest"
import { cacheGet, cacheSet, withCache } from "@/lib/cache"

// With no UPSTASH_* env in tests, the module uses its process-local fallback.
describe("cache (in-memory fallback)", () => {
  afterEach(() => vi.useRealTimers())

  it("cacheGet returns null on a miss", async () => {
    expect(await cacheGet("miss:1")).toBeNull()
  })

  it("cacheSet then cacheGet returns the value", async () => {
    await cacheSet("k:set", { a: 1 }, 60)
    expect(await cacheGet<{ a: number }>("k:set")).toEqual({ a: 1 })
  })

  it("withCache computes once, then serves from cache", async () => {
    const fn = vi.fn().mockResolvedValue(42)
    expect(await withCache("k:wc", 60, fn)).toBe(42)
    expect(await withCache("k:wc", 60, fn)).toBe(42)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("expires entries after their TTL", async () => {
    vi.useFakeTimers()
    await cacheSet("k:ttl", "v", 10)
    expect(await cacheGet("k:ttl")).toBe("v")
    vi.advanceTimersByTime(11_000)
    expect(await cacheGet("k:ttl")).toBeNull()
  })

  it("recomputes through withCache once the entry has expired", async () => {
    vi.useFakeTimers()
    const fn = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second")
    expect(await withCache("k:wc-ttl", 10, fn)).toBe("first")
    vi.advanceTimersByTime(11_000)
    expect(await withCache("k:wc-ttl", 10, fn)).toBe("second")
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
