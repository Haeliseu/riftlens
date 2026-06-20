import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "../../test/mocks/server"
import { RiotApiClient } from "../client"
import {
  getAverageGameRank,
  getChampionIconUrl,
  getChampionStats,
  getMatchHistory,
  getProfileIconUrl,
  getProfileSummary,
  queueName,
} from "../endpoints/profile"

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

describe("getMatchHistory", () => {
  it("reduces each match to the target player's line", async () => {
    const matches = await getMatchHistory(client, "EUW1", "test-puuid-123", 2)

    expect(matches).toHaveLength(2)
    expect(matches[0]).toMatchObject({
      championName: "LeeSin",
      kills: 8,
      deaths: 3,
      assists: 10,
      cs: 200,
      queueId: 420,
      position: "JUNGLE",
    })
    expect(matches.filter((m) => m.win)).toHaveLength(1)
  })
})

describe("getChampionStats", () => {
  it("aggregates per champion with solo/flex split", async () => {
    const stats = await getChampionStats(client, "EUW1", "test-puuid-123", 2)

    expect(stats).toHaveLength(1)
    const lee = stats[0]
    expect(lee?.championName).toBe("LeeSin")
    expect(lee?.total.games).toBe(2)
    expect(lee?.total.wins).toBe(1)
    // mock matches are queueId 420 -> solo bucket only
    expect(lee?.solo.games).toBe(2)
    expect(lee?.flex.games).toBe(0)
  })
})

describe("getAverageGameRank", () => {
  it("computes the median rank of sampled participants", async () => {
    const avg = await getAverageGameRank(client, "EUW1", "test-puuid-123", 2)

    expect(avg).not.toBeNull()
    expect(avg?.tier).toBe("Diamond")
    expect(avg?.division).toBe("III")
    expect(avg?.sampledPlayers).toBeGreaterThan(0)
  })

  it("returns null when no participant is ranked", async () => {
    server.use(
      http.get("https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/:puuid", () =>
        HttpResponse.json([])
      )
    )
    const avg = await getAverageGameRank(client, "EUW1", "test-puuid-123", 2)
    expect(avg).toBeNull()
  })
})

describe("url + queue helpers", () => {
  it("builds CommunityDragon icon URLs", () => {
    expect(getProfileIconUrl(42)).toBe(
      "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/42.jpg"
    )
    expect(getChampionIconUrl(64)).toContain("champion-icons/64.png")
  })

  it("maps queue ids to names", () => {
    expect(queueName(420)).toBe("Classé Solo/Duo")
    expect(queueName(450)).toBe("ARAM")
    expect(queueName(9999)).toBe("Autre")
    expect(queueName(null)).toBe("Autre")
  })
})
