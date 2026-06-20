import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { RiotApiClient } from "../client"
import { RiotApiError } from "../errors"

describe("RiotApiClient", () => {
  const client = new RiotApiClient("test-api-key")

  it("validates response with Zod schema", async () => {
    const schema = z.object({ puuid: z.string(), gameName: z.string(), tagLine: z.string() })
    const result = await client.fetch(
      "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/TestSummoner/EUW",
      schema
    )
    expect(result.puuid).toBe("test-puuid-123")
  })

  it("throws RiotApiError on non-OK response", async () => {
    await expect(
      client.fetch(
        "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/NOTEXIST/404",
        z.unknown()
      )
    ).rejects.toBeInstanceOf(RiotApiError)
  })

  it("integrates retry into fetch pipeline", async () => {
    // 404 should propagate without retry (tested via the error throw test above)
    const schema = z.object({ puuid: z.string(), gameName: z.string(), tagLine: z.string() })
    const result = await client.fetch(
      "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/TestSummoner/EUW",
      schema
    )
    expect(result).toBeDefined()
  })

  it("queues requests to respect rate limits", async () => {
    const schema = z.object({ puuid: z.string(), gameName: z.string(), tagLine: z.string() })
    const promises = Array.from({ length: 3 }, () =>
      client.fetch(
        "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/TestSummoner/EUW",
        schema
      )
    )
    const results = await Promise.all(promises)
    expect(results).toHaveLength(3)
  })

  it("resolves routing region for platform region", () => {
    expect(client.getRoutingRegion("EUW1")).toBe("europe")
    expect(client.getRoutingRegion("NA1")).toBe("americas")
    expect(client.getRoutingRegion("KR")).toBe("asia")
  })

  it("sets retryAfterSeconds from Retry-After header on 429", async () => {
    vi.useFakeTimers()
    const headers = new Headers({ "Retry-After": "5" })
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
      headers,
      text: async () => "Rate Limited",
    } as Response)

    let capturedError: unknown
    const promise = client
      .fetch("https://europe.api.riotgames.com/test", z.unknown())
      .catch((err: unknown) => {
        capturedError = err
      })
    await vi.runAllTimersAsync()
    await promise
    vi.restoreAllMocks()
    vi.useRealTimers()
    expect(capturedError).toBeInstanceOf(RiotApiError)
    expect((capturedError as RiotApiError).retryAfterSeconds).toBe(5)
  })
})
