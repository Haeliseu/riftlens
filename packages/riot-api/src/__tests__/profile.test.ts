import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { RiotApiClient } from "../client"
import { getProfileIconUrl, getProfileSummary } from "../endpoints/profile"
import { server } from "../../test/mocks/server"

const client = new RiotApiClient("test-api-key")

describe("getProfileSummary", () => {
  it("assembles account, summoner and Solo/Duo rank", async () => {
    const summary = await getProfileSummary(client, "EUW1", "TestSummoner", "EUW")

    expect(summary.puuid).toBe("test-puuid-123")
    expect(summary.profileIconId).toBe(1234)
    expect(summary.summonerLevel).toBe(200)
    expect(summary.soloRank).toEqual({
      tier: "DIAMOND",
      rank: "III",
      leaguePoints: 80,
      wins: 450,
      losses: 445,
    })
  })

  it("returns null soloRank when no ranked entries exist", async () => {
    server.use(
      http.get("https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/:puuid", () =>
        HttpResponse.json([])
      )
    )

    const summary = await getProfileSummary(client, "EUW1", "TestSummoner", "EUW")
    expect(summary.soloRank).toBeNull()
  })

  it("tolerates a failing ranked lookup", async () => {
    server.use(
      http.get("https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/:puuid", () =>
        HttpResponse.text("forbidden", { status: 403 })
      )
    )

    const summary = await getProfileSummary(client, "EUW1", "TestSummoner", "EUW")
    expect(summary.soloRank).toBeNull()
    expect(summary.summonerLevel).toBe(200)
  })
})

describe("getProfileIconUrl", () => {
  it("builds a CommunityDragon icon URL", () => {
    expect(getProfileIconUrl(42)).toBe(
      "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/42.jpg"
    )
  })
})
