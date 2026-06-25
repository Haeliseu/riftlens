import { db } from "@riftlens/db"
import { summonerMatches } from "@riftlens/db/schema"
import { eq } from "drizzle-orm"

export interface PingStat {
  key: string
  count: number
}

/**
 * Total ping counts (by Riot ping key) across stored matches. `games` is the
 * number of matches the counts are based on — only games we've ingested with
 * ping data contribute, so surfacing it keeps the total honest (it's not a
 * lifetime figure).
 */
export async function pingStatsFromDb(
  puuid: string
): Promise<{ total: number; games: number; byKey: PingStat[] }> {
  const rows = await db
    .select({ pings: summonerMatches.pings })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))

  const totals = new Map<string, number>()
  let games = 0
  for (const r of rows) {
    const p = r.pings as Record<string, number> | null
    if (!p) continue
    games++
    for (const [k, v] of Object.entries(p)) totals.set(k, (totals.get(k) ?? 0) + (v ?? 0))
  }
  const byKey = [...totals.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
  return { total: byKey.reduce((s, x) => s + x.count, 0), games, byKey }
}
