import type { Region, RiotApiClient } from "../client"
import { regionToRouting } from "../client"
import { getAccountByRiotId } from "./account"
import { getLeagueEntriesByPuuid } from "./league"
import { getSummonerByPuuid } from "./summoner"

export interface SoloRank {
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
}

export interface ProfileSummary {
  puuid: string
  gameName: string
  tagLine: string
  profileIconId: number
  summonerLevel: number
  soloRank: SoloRank | null
}

/**
 * Full search-result enrichment, matching what opgg/dpm show:
 * Riot ID → puuid → profile (icon, level) → ranked (Solo/Duo tier, LP, W/L).
 */
export async function getProfileSummary(
  client: RiotApiClient,
  region: Region,
  gameName: string,
  tagLine: string
): Promise<ProfileSummary> {
  const routing = regionToRouting(region)
  const account = await getAccountByRiotId(client, routing, gameName, tagLine)

  const [summoner, entries] = await Promise.all([
    getSummonerByPuuid(client, region, account.puuid),
    getLeagueEntriesByPuuid(client, region, account.puuid).catch(() => []),
  ])

  const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5")

  return {
    puuid: account.puuid,
    gameName: account.gameName ?? gameName,
    tagLine: account.tagLine ?? tagLine,
    profileIconId: summoner.profileIconId,
    summonerLevel: summoner.summonerLevel,
    soloRank: solo
      ? {
          tier: solo.tier,
          rank: solo.rank,
          leaguePoints: solo.leaguePoints,
          wins: solo.wins,
          losses: solo.losses,
        }
      : null,
  }
}

/** Data Dragon / CommunityDragon profile-icon image URL (version-free). */
export function getProfileIconUrl(profileIconId: number): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${profileIconId}.jpg`
}
