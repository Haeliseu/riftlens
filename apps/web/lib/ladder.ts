import type { Region, RiotApiClient } from "@riftlens/riot-api"
import {
  getAccountByPuuid,
  getMatch,
  getMatchIds,
  getSummonerByPuuid,
  regionToRouting,
} from "@riftlens/riot-api"
import { withCache } from "@/lib/cache"
import type { SeasonChamp } from "@/lib/profile-db"

export interface LadderPlayer {
  gameName: string | null
  tagLine: string | null
  profileIconId: number | null
  mainRole: string | null
  topChampions: SeasonChamp[]
}

const SEASON_MATCHES = 10

/**
 * Compute a ladder player's card (name, avatar, main role, top season champions)
 * straight from Riot — no DB ingestion. Matches are cached (immutable) so
 * premades + the match-detail view share them.
 */
export async function computeLadderPlayer(
  client: RiotApiClient,
  region: Region,
  puuid: string
): Promise<LadderPlayer> {
  const routing = regionToRouting(region)
  const [acc, summoner, ids] = await Promise.all([
    getAccountByPuuid(client, routing, puuid).catch(() => null),
    getSummonerByPuuid(client, region, puuid).catch(() => null),
    getMatchIds(client, routing, puuid, { type: "ranked", count: SEASON_MATCHES }).catch(() => []),
  ])

  const roleGames = new Map<string, number>()
  const byChamp = new Map<number, SeasonChamp>()
  for (const id of ids) {
    const m = await withCache(`match:${routing}:${id}`, 2_592_000, () =>
      getMatch(client, routing, id)
    ).catch(() => null)
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
    gameName: acc?.gameName ?? null,
    tagLine: acc?.tagLine ?? null,
    profileIconId: summoner?.profileIconId ?? null,
    mainRole: [...roleGames.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    topChampions: [...byChamp.values()].sort((a, b) => b.games - a.games).slice(0, 3),
  }
}
