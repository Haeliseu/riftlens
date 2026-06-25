import { db } from "@riftlens/db"
import { lpSnapshots, summonerMatches } from "@riftlens/db/schema"
import { and, eq } from "drizzle-orm"

export interface LpPoint {
  value: number
  tier: string
  division: string
  leaguePoints: number
  recordedAt: string
}

/** Solo/Duo LP snapshots over time (chronological) for the LP chart. */
export async function lpHistoryFromDb(puuid: string, queueId = 420): Promise<LpPoint[]> {
  const rows = await db
    .select({
      value: lpSnapshots.value,
      tier: lpSnapshots.tier,
      division: lpSnapshots.division,
      leaguePoints: lpSnapshots.leaguePoints,
      recordedAt: lpSnapshots.recordedAt,
    })
    .from(lpSnapshots)
    .where(and(eq(lpSnapshots.puuid, puuid), eq(lpSnapshots.queueId, queueId)))
    .orderBy(lpSnapshots.recordedAt)

  return rows.map((r) => ({
    value: r.value,
    tier: r.tier,
    division: r.division,
    leaguePoints: r.leaguePoints,
    recordedAt: (r.recordedAt as Date).toISOString(),
  }))
}

export interface LpPerGame {
  /** matchId -> LP change, only for unambiguously attributable games */
  matchLp: Record<string, number>
  /** matchId -> rank change across that game (tier/division crossed) */
  matchRankChange: Record<string, { dir: "promotion" | "demotion"; tier: string; division: string }>
  /** championId -> net LP across attributable games */
  byChampion: Record<number, number>
}

/**
 * Best-effort LP per game: Riot doesn't expose it, so we attribute the LP delta
 * between two consecutive snapshots to the single ranked game that sits between
 * them (when exactly one does). Ambiguous intervals are skipped.
 */
export async function lpPerGameFromDb(puuid: string): Promise<LpPerGame> {
  const snaps = await db
    .select({
      value: lpSnapshots.value,
      tier: lpSnapshots.tier,
      division: lpSnapshots.division,
      recordedAt: lpSnapshots.recordedAt,
    })
    .from(lpSnapshots)
    .where(and(eq(lpSnapshots.puuid, puuid), eq(lpSnapshots.queueId, 420)))
    .orderBy(lpSnapshots.recordedAt)

  const games = await db
    .select({
      matchId: summonerMatches.matchId,
      gameCreation: summonerMatches.gameCreation,
      championId: summonerMatches.championId,
    })
    .from(summonerMatches)
    .where(and(eq(summonerMatches.puuid, puuid), eq(summonerMatches.queueId, 420)))

  const matchLp: Record<string, number> = {}
  const matchRankChange: Record<
    string,
    { dir: "promotion" | "demotion"; tier: string; division: string }
  > = {}
  for (let i = 1; i < snaps.length; i++) {
    const a = snaps[i - 1]
    const b = snaps[i]
    if (!a || !b) continue
    const at = (a.recordedAt as Date).getTime()
    const bt = (b.recordedAt as Date).getTime()
    const between = games.filter(
      (g) => g.gameCreation != null && g.gameCreation > at && g.gameCreation <= bt
    )
    const matchId = between.length === 1 ? between[0]?.matchId : undefined
    if (matchId) {
      matchLp[matchId] = b.value - a.value
      // A crossed tier/division boundary means a promotion (LP went up) or a
      // demotion (LP went down) — the ladder value is continuous so its sign is
      // the reliable direction.
      if (a.tier !== b.tier || a.division !== b.division) {
        matchRankChange[matchId] = {
          dir: b.value >= a.value ? "promotion" : "demotion",
          tier: b.tier,
          division: b.division,
        }
      }
    }
  }

  const byChampion: Record<number, number> = {}
  for (const g of games) {
    if (g.matchId && g.championId != null && matchLp[g.matchId] !== undefined) {
      byChampion[g.championId] = (byChampion[g.championId] ?? 0) + (matchLp[g.matchId] ?? 0)
    }
  }
  return { matchLp, matchRankChange, byChampion }
}
