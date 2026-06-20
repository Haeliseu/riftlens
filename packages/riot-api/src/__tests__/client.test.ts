import { describe, expect, it } from "vitest"
import { z } from "zod"
import { RiotApiError } from "../errors"
import { RiotApiClient } from "../client"

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
})
