import { describe, expect, it } from "vitest"
import { RiotApiError } from "../errors"

describe("RiotApiError", () => {
  it("sets name and message", () => {
    const err = new RiotApiError(429, "/lol/match", "Rate limited")
    expect(err.name).toBe("RiotApiError")
    expect(err.message).toBe("Rate limited")
    expect(err.status).toBe(429)
    expect(err.endpoint).toBe("/lol/match")
  })

  it("isRateLimit true for 429", () => {
    expect(new RiotApiError(429, "/", "").isRateLimit).toBe(true)
    expect(new RiotApiError(500, "/", "").isRateLimit).toBe(false)
  })

  it("isMaintenance true for 503", () => {
    expect(new RiotApiError(503, "/", "").isMaintenance).toBe(true)
    expect(new RiotApiError(200, "/", "").isMaintenance).toBe(false)
  })

  it("isNotFound true for 404", () => {
    expect(new RiotApiError(404, "/", "").isNotFound).toBe(true)
    expect(new RiotApiError(200, "/", "").isNotFound).toBe(false)
  })

  it("isUnauthorized true for 401 and 403", () => {
    expect(new RiotApiError(401, "/", "").isUnauthorized).toBe(true)
    expect(new RiotApiError(403, "/", "").isUnauthorized).toBe(true)
    expect(new RiotApiError(200, "/", "").isUnauthorized).toBe(false)
  })

  it("isRetryable true for 429, 503, and 5xx", () => {
    expect(new RiotApiError(429, "/", "").isRetryable).toBe(true)
    expect(new RiotApiError(503, "/", "").isRetryable).toBe(true)
    expect(new RiotApiError(500, "/", "").isRetryable).toBe(true)
    expect(new RiotApiError(404, "/", "").isRetryable).toBe(false)
  })

  it("retryAfterSeconds defaults to null", () => {
    expect(new RiotApiError(429, "/", "").retryAfterSeconds).toBeNull()
  })
})
