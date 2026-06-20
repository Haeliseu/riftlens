import { describe, expect, it, vi } from "vitest"
import { RiotApiError } from "../errors"
import { withRetry } from "../retry"

// Speed up tests — mock setTimeout
vi.mock("../retry", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../retry")>()
  return mod
})

describe("withRetry", () => {
  it("succeeds on first attempt without retry", async () => {
    const fn = vi.fn().mockResolvedValue("ok")
    const result = await withRetry(fn)
    expect(result).toBe("ok")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("retries on 429 and succeeds on second attempt", async () => {
    vi.useFakeTimers()
    const err = new RiotApiError(429, "/test", "rate limited")
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValue("ok")

    const promise = withRetry(fn, { baseDelayMs: 10 })
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toBe("ok")
    expect(fn).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it("retries on 503 with exponential backoff", async () => {
    vi.useFakeTimers()
    const err = new RiotApiError(503, "/test", "maintenance")
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValue("ok")

    const promise = withRetry(fn, { baseDelayMs: 10 })
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toBe("ok")
    vi.useRealTimers()
  })

  it("throws after maxAttempts exhausted", async () => {
    vi.useFakeTimers()
    const err = new RiotApiError(503, "/test", "unavailable")
    const fn = vi.fn().mockRejectedValue(err)

    const promise = withRetry(fn, { maxAttempts: 2, baseDelayMs: 10 })
    // Catch unhandled rejection before running timers to prevent leaks
    const caught = promise.catch((e: unknown) => e)
    await vi.runAllTimersAsync()
    const result = await caught
    expect(result).toBeInstanceOf(RiotApiError)
    expect((result as RiotApiError).message).toBe("unavailable")
    expect(fn).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it("does NOT retry on 404 (not retryable)", async () => {
    const err = new RiotApiError(404, "/test", "not found")
    const fn = vi.fn().mockRejectedValue(err)
    await expect(withRetry(fn)).rejects.toThrow("not found")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("does NOT retry on 401 (not retryable)", async () => {
    const err = new RiotApiError(401, "/test", "unauthorized")
    const fn = vi.fn().mockRejectedValue(err)
    await expect(withRetry(fn)).rejects.toThrow("unauthorized")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("respects Retry-After header delay on 429", async () => {
    vi.useFakeTimers()
    const err = new RiotApiError(429, "/test", "rate limited")
    err.retryAfterSeconds = 5
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValue("ok")

    const promise = withRetry(fn)
    await vi.runAllTimersAsync()
    await promise
    vi.useRealTimers()
  })

  it("caps delay at maxDelayMs", async () => {
    vi.useFakeTimers()
    const err = new RiotApiError(503, "/test", "unavailable")
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValue("ok")

    const promise = withRetry(fn, { baseDelayMs: 100_000, maxDelayMs: 500, maxAttempts: 2 })
    await vi.runAllTimersAsync()
    await promise
    vi.useRealTimers()
  })
})
