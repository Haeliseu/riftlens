import type { Region, RiotApiClient } from "../client"
import {
  LeagueEntriesSchema,
  type LeagueEntry,
  type LeagueList,
  LeagueListSchema,
} from "../types/ranked"

export type ApexTier = "challenger" | "grandmaster" | "master"

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

/** Apex ladder (Challenger/Grandmaster/Master) for a queue, e.g. RANKED_SOLO_5x5. */
export async function getApexLeague(
  client: RiotApiClient,
  region: Region,
  tier: ApexTier,
  queue = "RANKED_SOLO_5x5"
): Promise<LeagueList> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/${tier}leagues/by-queue/${queue}`
  return client.fetch(url, LeagueListSchema)
}
