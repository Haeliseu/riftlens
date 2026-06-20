import type { Region, RiotApiClient } from "../client"
import { LeagueEntriesSchema, type LeagueEntry } from "../types/ranked"

export async function getLeagueEntriesBySummonerId(
  client: RiotApiClient,
  region: Region,
  summonerId: string
): Promise<LeagueEntry[]> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`
  return client.fetch(url, LeagueEntriesSchema)
}

/** Modern, recommended endpoint — avoids the encrypted summonerId round-trip. */
export async function getLeagueEntriesByPuuid(
  client: RiotApiClient,
  region: Region,
  puuid: string
): Promise<LeagueEntry[]> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`
  return client.fetch(url, LeagueEntriesSchema)
}
