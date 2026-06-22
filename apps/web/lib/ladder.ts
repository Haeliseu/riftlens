import type { Region, RiotApiClient } from "@riftlens/riot-api"
import {
  getAccountByPuuid,
  getMatchIds,
  getSummonerByPuuid,
  regionToRouting,
} from "@riftlens/riot-api"
import type { SeasonChamp } from "@/lib/profile-db"
import { cachedMatch } from "@/lib/riot-cache"

/** Cheap identity: name + avatar (2 Riot calls). */
export interface LadderId {
  gameName: string | null
  tagLine: string | null
  profileIconId: number | null
}

/** Heavier season aggregate: main role + top champions (needs match fetches). */
export interface LadderSeason {
  mainRole: string | null
  topChampions: SeasonChamp[]
}

const SEASON_MATCHES = 8

export async function computeLadderId(
  client: RiotApiClient,
  region: Region,
  puuid: string
): Promise<LadderId> {
  const routing = regionToRouting(region)
  const [acc, summoner] = await Promise.all([
    getAccountByPuuid(client, routing, puuid).catch(() => null),
    getSummonerByPuuid(client, region, puuid).catch(() => null),
  ])
  return {
    gameName: acc?.gameName ?? null,
    tagLine: acc?.tagLine ?? null,
    profileIconId: summoner?.profileIconId ?? null,
  }
}

export async function computeLadderSeason(
  client: RiotApiClient,
  region: Region,
  puuid: string
): Promise<LadderSeason> {
  const routing = regionToRouting(region)
  const ids = await getMatchIds(client, routing, puuid, {
    type: "ranked",
    count: SEASON_MATCHES,
  }).catch(() => [])

  const roleGames = new Map<string, number>()
  const byChamp = new Map<number, SeasonChamp>()
  for (const id of ids) {
    // Cached and shared with the match-detail view (immutable).
    const m = await cachedMatch(client, routing, id).catch(() => null)
    const me = m?.info.participants.find((p) => p.puuid === puuid)
    if (!me) continue
    const role = me.teamPosition || me.individualPosition || "UNKNOWN"
    if (role !== "UNKNOWN") roleGames.set(role, (roleGames.get(role) ?? 0) + 1)
    const c = byChamp.get(me.championId) ?? {
      championId: me.championId,
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    }
    c.games += 1
    c.wins += me.win ? 1 : 0
    c.kills += me.kills
    c.deaths += me.deaths
    c.assists += me.assists
    byChamp.set(me.championId, c)
  }

  return {
    mainRole: [...roleGames.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    topChampions: [...byChamp.values()].sort((a, b) => b.games - a.games).slice(0, 3),
  }
}
