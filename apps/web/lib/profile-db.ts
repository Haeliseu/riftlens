import { db } from "@riftlens/db"
import { lpSnapshots, matchParticipants, summonerMatches, summoners } from "@riftlens/db/schema"
import type { ChampionAggregate, ChampionBucket } from "@riftlens/riot-api"
import { and, desc, eq, inArray } from "drizzle-orm"

function emptyBucket(): ChampionBucket {
  return { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 }
}

/** Per-champion aggregate over ALL stored ranked games (full accumulated season). */
export async function championStatsFromDb(puuid: string): Promise<ChampionAggregate[]> {
  const rows = await db
    .select({
      championId: summonerMatches.championId,
      championName: summonerMatches.championName,
      queueId: summonerMatches.queueId,
      kills: summonerMatches.kills,
      deaths: summonerMatches.deaths,
      assists: summonerMatches.assists,
      win: summonerMatches.win,
    })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))

  const byChamp = new Map<number, ChampionAggregate>()
  for (const r of rows) {
    if (r.championId == null) continue
    const agg =
      byChamp.get(r.championId) ??
      ({
        championId: r.championId,
        championName: r.championName ?? "",
        total: emptyBucket(),
        solo: emptyBucket(),
        flex: emptyBucket(),
      } satisfies ChampionAggregate)
    const line = {
      win: r.win ?? false,
      k: r.kills ?? 0,
      d: r.deaths ?? 0,
      a: r.assists ?? 0,
    }
    add(agg.total, line)
    if (r.queueId === 420) add(agg.solo, line)
    else if (r.queueId === 440) add(agg.flex, line)
    byChamp.set(r.championId, agg)
  }
  return [...byChamp.values()].sort((a, b) => b.total.games - a.total.games)
}

function add(b: ChampionBucket, p: { win: boolean; k: number; d: number; a: number }) {
  b.games += 1
  b.wins += p.win ? 1 : 0
  b.kills += p.k
  b.deaths += p.d
  b.assists += p.a
}

export interface LpPoint {
  value: number
  tier: string
  division: string
  leaguePoints: number
  recordedAt: string
}

/** Solo/Duo LP snapshots over time (chronological) for the LP chart. */
export async function lpHistoryFromDb(puuid: string): Promise<LpPoint[]> {
  const rows = await db
    .select({
      value: lpSnapshots.value,
      tier: lpSnapshots.tier,
      division: lpSnapshots.division,
      leaguePoints: lpSnapshots.leaguePoints,
      recordedAt: lpSnapshots.recordedAt,
    })
    .from(lpSnapshots)
    .where(and(eq(lpSnapshots.puuid, puuid), eq(lpSnapshots.queueId, 420)))
    .orderBy(lpSnapshots.recordedAt)

  return rows.map((r) => ({
    value: r.value,
    tier: r.tier,
    division: r.division,
    leaguePoints: r.leaguePoints,
    recordedAt: (r.recordedAt as Date).toISOString(),
  }))
}

export interface CachedRank {
  tier: string
  division: string
  leaguePoints: number
}

/** Distinct participant puuids from the player's most recent stored matches. */
export async function recentParticipantPuuids(puuid: string, games = 20): Promise<string[]> {
  const recent = await db
    .select({ matchId: summonerMatches.matchId })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))
    .orderBy(desc(summonerMatches.gameCreation))
    .limit(games)
  const ids = recent.map((r) => r.matchId).filter((x): x is string => x != null)
  if (ids.length === 0) return []

  const parts = await db
    .select({ puuid: matchParticipants.puuid })
    .from(matchParticipants)
    .where(inArray(matchParticipants.matchId, ids))
  return [...new Set(parts.map((p) => p.puuid))]
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
