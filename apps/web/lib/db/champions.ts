import { db } from "@riftlens/db"
import { summonerMatches } from "@riftlens/db/schema"
import { eq } from "drizzle-orm"

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

function addDetail(
  b: ChampDetailBucket,
  r: {
    win: boolean
    k: number
    d: number
    a: number
    csPerMin: number
    kp: number
    gold: number
    damage: number
    vision: number
  }
) {
  b.games += 1
  b.wins += r.win ? 1 : 0
  b.kills += r.k
  b.deaths += r.d
  b.assists += r.a
  b.csPerMin += r.csPerMin
  b.kp += r.kp
  b.gold += r.gold
  b.damage += r.damage
  b.vision += r.vision
}

/** Detailed per-champion aggregate over ALL stored ranked games. */
export async function championStatsFromDb(puuid: string): Promise<ChampionDetail[]> {
  const rows = await db
    .select({
      championId: summonerMatches.championId,
      championName: summonerMatches.championName,
      queueId: summonerMatches.queueId,
      kills: summonerMatches.kills,
      deaths: summonerMatches.deaths,
      assists: summonerMatches.assists,
      win: summonerMatches.win,
      csPerMin: summonerMatches.csPerMin,
      kp: summonerMatches.killParticipation,
      gold: summonerMatches.goldEarned,
      damage: summonerMatches.totalDamageDealt,
      vision: summonerMatches.visionScore,
    })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))

  const byChamp = new Map<number, ChampionDetail>()
  for (const r of rows) {
    if (r.championId == null) continue
    const agg =
      byChamp.get(r.championId) ??
      ({
        championId: r.championId,
        championName: r.championName ?? "",
        total: emptyDetail(),
        solo: emptyDetail(),
        flex: emptyDetail(),
        aram: emptyDetail(),
        arena: emptyDetail(),
      } satisfies ChampionDetail)
    const line = {
      win: r.win ?? false,
      k: r.kills ?? 0,
      d: r.deaths ?? 0,
      a: r.assists ?? 0,
      csPerMin: r.csPerMin ?? 0,
      kp: r.kp ?? 0,
      gold: r.gold ?? 0,
      damage: r.damage ?? 0,
      vision: r.vision ?? 0,
    }
    addDetail(agg.total, line)
    if (r.queueId === 420) addDetail(agg.solo, line)
    else if (r.queueId === 440) addDetail(agg.flex, line)
    else if (r.queueId === 450) addDetail(agg.aram, line)
    else if (r.queueId === 1700 || r.queueId === 1710) addDetail(agg.arena, line)
    byChamp.set(r.championId, agg)
  }
  return [...byChamp.values()].sort((a, b) => b.total.games - a.total.games)
}
