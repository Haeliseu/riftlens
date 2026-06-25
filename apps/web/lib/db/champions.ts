import { db } from "@riftlens/db"
import { summonerMatches } from "@riftlens/db/schema"
import { and, eq, inArray, isNotNull, type SQL, sql } from "drizzle-orm"

// Detailed per-champion aggregate. Bucket holds SUMS; the UI divides by games.
export interface ChampDetailBucket {
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
  csPerMin: number
  kp: number // sum of killParticipation (0–1)
  gold: number
  damage: number
  vision: number
}

export interface ChampionDetail {
  championId: number
  championName: string
  total: ChampDetailBucket
  solo: ChampDetailBucket
  flex: ChampDetailBucket
  aram: ChampDetailBucket
  arena: ChampDetailBucket
}

function emptyDetail(): ChampDetailBucket {
  return {
    games: 0,
    wins: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    csPerMin: 0,
    kp: 0,
    gold: 0,
    damage: 0,
    vision: 0,
  }
}

interface AggRow extends ChampDetailBucket {
  championId: number
  championName: string
}

// One GROUP BY per queue bucket — the DB does the aggregation (was an in-JS
// reduce over every stored row). `wins` uses CASE (Postgres has no bool→int
// cast); cs/min and kp are summed as float8, the rest as int.
const BUCKET_SELECT = {
  championId: summonerMatches.championId,
  championName: sql<string>`coalesce(max(${summonerMatches.championName}), '')`,
  games: sql<number>`count(*)::int`,
  wins: sql<number>`coalesce(sum(case when ${summonerMatches.win} then 1 else 0 end), 0)::int`,
  kills: sql<number>`coalesce(sum(${summonerMatches.kills}), 0)::int`,
  deaths: sql<number>`coalesce(sum(${summonerMatches.deaths}), 0)::int`,
  assists: sql<number>`coalesce(sum(${summonerMatches.assists}), 0)::int`,
  csPerMin: sql<number>`coalesce(sum(${summonerMatches.csPerMin}), 0)::float8`,
  kp: sql<number>`coalesce(sum(${summonerMatches.killParticipation}), 0)::float8`,
  gold: sql<number>`coalesce(sum(${summonerMatches.goldEarned}), 0)::int`,
  damage: sql<number>`coalesce(sum(${summonerMatches.totalDamageDealt}), 0)::int`,
  vision: sql<number>`coalesce(sum(${summonerMatches.visionScore}), 0)::int`,
}

function bucket(where: SQL | undefined): Promise<AggRow[]> {
  return db
    .select(BUCKET_SELECT)
    .from(summonerMatches)
    .where(where)
    .groupBy(summonerMatches.championId) as Promise<AggRow[]>
}

function toBucket(r: AggRow | undefined): ChampDetailBucket {
  if (!r) return emptyDetail()
  const { championId: _id, championName: _name, ...b } = r
  return b
}

/** Detailed per-champion aggregate over ALL stored ranked games (DB-side). */
export async function championStatsFromDb(puuid: string): Promise<ChampionDetail[]> {
  const base = and(eq(summonerMatches.puuid, puuid), isNotNull(summonerMatches.championId))
  const [total, solo, flex, aram, arena] = await Promise.all([
    bucket(base),
    bucket(and(base, eq(summonerMatches.queueId, 420))),
    bucket(and(base, eq(summonerMatches.queueId, 440))),
    bucket(and(base, eq(summonerMatches.queueId, 450))),
    bucket(and(base, inArray(summonerMatches.queueId, [1700, 1710]))),
  ])

  const index = (rows: AggRow[]) => new Map(rows.map((r) => [r.championId, r]))
  const soloBy = index(solo)
  const flexBy = index(flex)
  const aramBy = index(aram)
  const arenaBy = index(arena)

  // `total` has one row per champion the player has any game on.
  return total
    .map((t) => ({
      championId: t.championId,
      championName: t.championName,
      total: toBucket(t),
      solo: toBucket(soloBy.get(t.championId)),
      flex: toBucket(flexBy.get(t.championId)),
      aram: toBucket(aramBy.get(t.championId)),
      arena: toBucket(arenaBy.get(t.championId)),
    }))
    .sort((a, b) => b.total.games - a.total.games)
}
