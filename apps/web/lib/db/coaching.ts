import { db } from "@riftlens/db"
import { matches, summonerMatches } from "@riftlens/db/schema"
import { and, eq, inArray } from "drizzle-orm"

export interface CoachInput {
  role: string
  games: number
  csPerMin: number
  kp: number // 0..1
  deathsPerGame: number
  kda: number
  visionPerMin: number
  goldPerMin: number
  dpm: number // damage to champions per minute
  winRate: number // 0..100
}

/** Aggregate the player's main role from stored ranked games for the coaching
 * engine. Joins matches for game duration → per-minute gold/vision. */
export async function coachingFromDb(puuid: string): Promise<CoachInput | null> {
  const rows = await db
    .select({
      role: summonerMatches.role,
      kills: summonerMatches.kills,
      deaths: summonerMatches.deaths,
      assists: summonerMatches.assists,
      win: summonerMatches.win,
      visionScore: summonerMatches.visionScore,
      goldEarned: summonerMatches.goldEarned,
      damage: summonerMatches.totalDamageDealt,
      csPerMin: summonerMatches.csPerMin,
      kp: summonerMatches.killParticipation,
      duration: matches.gameDuration,
    })
    .from(summonerMatches)
    .innerJoin(matches, eq(summonerMatches.matchId, matches.matchId))
    .where(and(eq(summonerMatches.puuid, puuid), inArray(summonerMatches.queueId, [420, 440])))

  if (rows.length === 0) return null

  type Agg = {
    games: number
    wins: number
    kills: number
    deaths: number
    assists: number
    visionPerMin: number
    goldPerMin: number
    dpm: number
    csPerMin: number
    kp: number
  }
  const byRole = new Map<string, Agg>()
  for (const r of rows) {
    const role = r.role || "UNKNOWN"
    const a = byRole.get(role) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      visionPerMin: 0,
      goldPerMin: 0,
      dpm: 0,
      csPerMin: 0,
      kp: 0,
    }
    const mins = (r.duration ?? 0) / 60
    a.games += 1
    a.wins += r.win ? 1 : 0
    a.kills += r.kills ?? 0
    a.deaths += r.deaths ?? 0
    a.assists += r.assists ?? 0
    a.visionPerMin += mins > 0 ? (r.visionScore ?? 0) / mins : 0
    a.goldPerMin += mins > 0 ? (r.goldEarned ?? 0) / mins : 0
    a.dpm += mins > 0 ? (r.damage ?? 0) / mins : 0
    a.csPerMin += r.csPerMin ?? 0
    a.kp += r.kp ?? 0
    byRole.set(role, a)
  }

  // Main role = most games (ignore UNKNOWN unless it's the only one).
  const ranked = [...byRole.entries()]
    .filter(([role]) => role !== "UNKNOWN")
    .sort((a, b) => b[1].games - a[1].games)
  const main = ranked[0] ?? [...byRole.entries()][0]
  if (!main) return null
  const [role, a] = main

  const kda = a.deaths === 0 ? a.kills + a.assists : (a.kills + a.assists) / a.deaths
  return {
    role,
    games: a.games,
    csPerMin: a.csPerMin / a.games,
    kp: a.kp / a.games,
    deathsPerGame: a.deaths / a.games,
    kda,
    visionPerMin: a.visionPerMin / a.games,
    goldPerMin: a.goldPerMin / a.games,
    dpm: a.dpm / a.games,
    winRate: Math.round((a.wins / a.games) * 100),
  }
}
