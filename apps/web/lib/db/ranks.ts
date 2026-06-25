import { db } from "@riftlens/db"
import { matchParticipants, summonerMatches, summoners } from "@riftlens/db/schema"
import { desc, eq, inArray } from "drizzle-orm"

export interface CachedRank {
  tier: string
  division: string
  leaguePoints: number
}

/** Distinct participant puuids from the player's most recent stored matches. */
export async function recentParticipantPuuids(
  puuid: string,
  games = 20
): Promise<{ puuids: string[]; games: number }> {
  const recent = await db
    .select({ matchId: summonerMatches.matchId })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))
    .orderBy(desc(summonerMatches.gameCreation))
    .limit(games)
  const ids = recent.map((r) => r.matchId).filter((x): x is string => x != null)
  if (ids.length === 0) return { puuids: [], games: 0 }

  const parts = await db
    .select({ puuid: matchParticipants.puuid })
    .from(matchParticipants)
    .where(inArray(matchParticipants.matchId, ids))
  return { puuids: [...new Set(parts.map((p) => p.puuid))], games: ids.length }
}

/** Read cached Solo ranks for a set of puuids (only those checked recently). */
export async function cachedRanks(
  puuids: string[],
  maxAgeMs = 7 * 24 * 3_600_000
): Promise<Map<string, CachedRank>> {
  if (puuids.length === 0) return new Map()
  const rows = await db
    .select({
      puuid: summoners.puuid,
      tier: summoners.soloTier,
      division: summoners.soloDivision,
      lp: summoners.soloLeaguePoints,
      checkedAt: summoners.rankCheckedAt,
    })
    .from(summoners)
    .where(inArray(summoners.puuid, puuids))

  const out = new Map<string, CachedRank>()
  const cutoff = Date.now() - maxAgeMs
  for (const r of rows) {
    if (!r.tier || !r.division || r.lp == null) continue
    if (r.checkedAt && (r.checkedAt as Date).getTime() < cutoff) continue
    out.set(r.puuid, { tier: r.tier, division: r.division, leaguePoints: r.lp })
  }
  return out
}

/** Upsert a participant's Solo rank into the summoners cache. */
export async function cacheParticipantRank(
  puuid: string,
  region: string,
  rank: CachedRank
): Promise<void> {
  await db
    .insert(summoners)
    .values({
      puuid,
      region,
      gameName: "",
      tagLine: "",
      soloTier: rank.tier,
      soloDivision: rank.division,
      soloLeaguePoints: rank.leaguePoints,
      rankCheckedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: summoners.puuid,
      set: {
        soloTier: rank.tier,
        soloDivision: rank.division,
        soloLeaguePoints: rank.leaguePoints,
        rankCheckedAt: new Date(),
      },
    })
}
