import { describe, expect, it, vi } from "vitest"
import type { RiotApiClient } from "../../client"
import { getAccountByPuuid, getAccountByRiotId, getActiveRegion } from "../account"
import {
  getApexLeague,
  getLeagueEntriesByPuuid,
  getLeagueEntriesBySummonerId,
  getLeagueExpEntries,
} from "../league"
import { getMatch, getMatchIds, getMatchTimeline } from "../match"
import { getSummonerById, getSummonerByPuuid } from "../summoner"

function mockClient(result: unknown) {
  const fetch = vi.fn().mockResolvedValue(result)
  return { client: { fetch } as unknown as RiotApiClient, fetch }
}
const urlOf = (fetch: ReturnType<typeof vi.fn>) => fetch.mock.calls[0]?.[0] as string

describe("league endpoints", () => {
  it("builds the by-summoner URL", async () => {
    const { client, fetch } = mockClient([])
    const r = await getLeagueEntriesBySummonerId(client, "EUW1", "SID")
    expect(urlOf(fetch)).toBe(
      "https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/SID"
    )
    expect(r).toEqual([])
  })
  it("builds the by-puuid URL", async () => {
    const { client, fetch } = mockClient([])
    await getLeagueEntriesByPuuid(client, "NA1", "PU")
    expect(urlOf(fetch)).toBe("https://na1.api.riotgames.com/lol/league/v4/entries/by-puuid/PU")
  })
  it("apex league: default + custom queue", async () => {
    const a = mockClient({ entries: [] })
    await getApexLeague(a.client, "KR", "challenger")
    expect(urlOf(a.fetch)).toBe(
      "https://kr.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5"
    )
    const b = mockClient({ entries: [] })
    await getApexLeague(b.client, "KR", "master", "RANKED_FLEX_SR")
    expect(urlOf(b.fetch)).toBe(
      "https://kr.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_FLEX_SR"
    )
  })
  it("league-exp: tier/division/page URL", async () => {
    const { client, fetch } = mockClient([])
    await getLeagueExpEntries(client, "EUW1", "RANKED_SOLO_5x5", "DIAMOND", "II", 3)
    expect(urlOf(fetch)).toBe(
      "https://euw1.api.riotgames.com/lol/league-exp/v4/entries/RANKED_SOLO_5x5/DIAMOND/II?page=3"
    )
  })
})

describe("summoner endpoints", () => {
  it("by-puuid", async () => {
    const { client, fetch } = mockClient({})
    await getSummonerByPuuid(client, "EUW1", "PU")
    expect(urlOf(fetch)).toBe(
      "https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/PU"
    )
  })
  it("by-id", async () => {
    const { client, fetch } = mockClient({})
    await getSummonerById(client, "EUW1", "SID")
    expect(urlOf(fetch)).toBe("https://euw1.api.riotgames.com/lol/summoner/v4/summoners/SID")
  })
})

describe("account endpoints", () => {
  it("active region uppercases the platform id", async () => {
    const { client, fetch } = mockClient({ puuid: "p", game: "lol", region: "euw1" })
    const r = await getActiveRegion(client, "europe", "PU")
    expect(urlOf(fetch)).toBe(
      "https://europe.api.riotgames.com/riot/account/v1/region/by-game/lol/by-puuid/PU"
    )
    expect(r).toBe("EUW1")
  })
  it("by-riot-id encodes name and tag", async () => {
    const { client, fetch } = mockClient({})
    await getAccountByRiotId(client, "americas", "Hide on bush", "KR1")
    expect(urlOf(fetch)).toBe(
      "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Hide%20on%20bush/KR1"
    )
  })
  it("by-puuid", async () => {
    const { client, fetch } = mockClient({})
    await getAccountByPuuid(client, "asia", "PU")
    expect(urlOf(fetch)).toBe("https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid/PU")
  })
})

describe("match endpoints", () => {
  it("match ids with all options (ms→s for time bounds)", async () => {
    const { client, fetch } = mockClient([])
    await getMatchIds(client, "europe", "PU", {
      queue: 420,
      type: "ranked",
      start: 10,
      count: 20,
      startTime: 1_700_000_000_000,
      endTime: 1_700_000_600_000,
    })
    const u = urlOf(fetch)
    expect(u).toContain("/lol/match/v5/matches/by-puuid/PU/ids?")
    expect(u).toContain("queue=420")
    expect(u).toContain("type=ranked")
    expect(u).toContain("start=10")
    expect(u).toContain("count=20")
    expect(u).toContain("startTime=1700000000")
    expect(u).toContain("endTime=1700000600")
  })
  it("match ids with no options", async () => {
    const { client, fetch } = mockClient([])
    await getMatchIds(client, "americas", "PU")
    expect(urlOf(fetch)).toBe(
      "https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/PU/ids?"
    )
  })
  it("getMatch + getMatchTimeline URLs", async () => {
    const a = mockClient({})
    await getMatch(a.client, "europe", "EUW1_1")
    expect(urlOf(a.fetch)).toBe("https://europe.api.riotgames.com/lol/match/v5/matches/EUW1_1")
    const b = mockClient({})
    await getMatchTimeline(b.client, "europe", "EUW1_1")
    expect(urlOf(b.fetch)).toBe(
      "https://europe.api.riotgames.com/lol/match/v5/matches/EUW1_1/timeline"
    )
  })
})
