import { db } from "@riftlens/db"
import { summonerMatches } from "@riftlens/db/schema"
import { and, eq, inArray } from "drizzle-orm"

export interface SeasonChamp {
  championId: number
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
}
export interface PlayerSeason {
  mainRole: string | null
  topChampions: SeasonChamp[]
}

/** Main role (majority of stored ranked games) + top season champions, for the
 * leaderboard. Reads only what's already in our DB. */
export async function playerSeasonFromDb(puuid: string): Promise<PlayerSeason> {
  const rows = await db
    .select({
      role: summonerMatches.role,
      championId: summonerMatches.championId,
      kills: summonerMatches.kills,
      deaths: summonerMatches.deaths,
      assists: summonerMatches.assists,
      win: summonerMatches.win,
    })
    .from(summonerMatches)
    .where(and(eq(summonerMatches.puuid, puuid), inArray(summonerMatches.queueId, [420, 440])))

  if (rows.length === 0) return { mainRole: null, topChampions: [] }

  const roleGames = new Map<string, number>()
  const byChamp = new Map<number, SeasonChamp>()
  for (const r of rows) {
    const role = r.role || "UNKNOWN"
    if (role !== "UNKNOWN") roleGames.set(role, (roleGames.get(role) ?? 0) + 1)
    if (r.championId == null) continue
    const c = byChamp.get(r.championId) ?? {
      championId: r.championId,
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    }
    c.games += 1
    c.wins += r.win ? 1 : 0
    c.kills += r.kills ?? 0
    c.deaths += r.deaths ?? 0
    c.assists += r.assists ?? 0
    byChamp.set(r.championId, c)
  }

  const mainRole = [...roleGames.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const topChampions = [...byChamp.values()].sort((a, b) => b.games - a.games).slice(0, 3)
  return { mainRole, topChampions }
}

export interface RolePerf {
  role: string
  games: number
  wins: number
}

/** Win/games per role from stored ranked games (role = stored teamPosition). */
export async function rolePerformanceFromDb(puuid: string): Promise<RolePerf[]> {
  const rows = await db
    .select({ role: summonerMatches.role, win: summonerMatches.win })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))

  const byRole = new Map<string, RolePerf>()
  for (const r of rows) {
    const role = r.role || "UNKNOWN"
    const agg = byRole.get(role) ?? { role, games: 0, wins: 0 }
    agg.games += 1
    agg.wins += r.win ? 1 : 0
    byRole.set(role, agg)
  }
  return [...byRole.values()].sort((a, b) => b.games - a.games)
}
