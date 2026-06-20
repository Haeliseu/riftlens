import type { Region, RiotApiClient } from "../client"
import { regionToRouting } from "../client"
import { getAccountByRiotId } from "./account"
import { getLeagueEntriesByPuuid } from "./league"
import { getMatch, getMatchIds } from "./match"
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

/** CommunityDragon champion square icon (version-free), keyed by championId. */
export function getChampionIconUrl(championId: number): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`
}

const QUEUE_NAMES: Record<number, string> = {
  400: "Normale",
  420: "Classé Solo/Duo",
  430: "Normale",
  440: "Classé Flexible",
  450: "ARAM",
  490: "Partie rapide",
  700: "Clash",
  1700: "Arena",
}

export function queueName(queueId: number | null | undefined): string {
  return queueId != null ? (QUEUE_NAMES[queueId] ?? "Autre") : "Autre"
}

export interface MatchSummary {
  matchId: string
  championId: number
  championName: string
  win: boolean
  kills: number
  deaths: number
  assists: number
  cs: number
  queueId: number | null
  position: string | null
  gameCreationMs: number
  gameDurationS: number
}

/**
 * Fetches the player's recent ranked matches (Solo/Duo by default) and reduces
 * each to the target player's line — what opgg/dpm render in the match list.
 */
export async function getMatchHistory(
  client: RiotApiClient,
  region: Region,
  puuid: string,
  count = 10,
  queue = 420
): Promise<MatchSummary[]> {
  const routing = regionToRouting(region)
  const ids = await getMatchIds(client, routing, puuid, { queue, count })

  const matches = await Promise.all(
    ids.map((id) =>
      getMatch(client, routing, id)
        .then((m): MatchSummary | null => {
          const p = m.info.participants.find((x) => x.puuid === puuid)
          if (!p) return null
          return {
            matchId: m.metadata.matchId,
            championId: p.championId,
            championName: p.championName,
            win: p.win,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            cs: (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0),
            queueId: m.info.queueId ?? null,
            position: p.teamPosition ?? p.individualPosition ?? null,
            gameCreationMs: m.info.gameCreation,
            gameDurationS: m.info.gameDuration,
          }
        })
        .catch(() => null)
    )
  )

  return matches.filter((m): m is MatchSummary => m !== null)
}
