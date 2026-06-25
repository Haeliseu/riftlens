import { db } from "@riftlens/db"
import { summonerMatches } from "@riftlens/db/schema"
import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { type ChampDetailBucket, type ChampionDetail, championStatsFromDb } from "../champions"

// Integration test against a dev Postgres. Skipped when DATABASE_URL is unset
// (e.g. CI), so it never blocks the normal suite.
const D = describe.skipIf(!process.env.DATABASE_URL)

const PUUID = "__test_champ_agg__"

interface Seed {
  championId: number | null
  championName: string | null
  queueId: number
  win: boolean
  kills: number
  deaths: number
  assists: number
  csPerMin: number
  killParticipation: number
  goldEarned: number
  totalDamageDealt: number
  visionScore: number
}

// Covers: total accumulation, solo(420), flex(440), aram(450), arena(1700 & 1710),
// an unknown queue (999 → total only), a null champion (skipped), and cs/min=0.
const SEED: Seed[] = [
  {
    championId: 103,
    championName: "Ahri",
    queueId: 420,
    win: true,
    kills: 10,
    deaths: 2,
    assists: 8,
    csPerMin: 7.5,
    killParticipation: 0.6,
    goldEarned: 12000,
    totalDamageDealt: 25000,
    visionScore: 20,
  },
  {
    championId: 103,
    championName: "Ahri",
    queueId: 420,
    win: false,
    kills: 3,
    deaths: 7,
    assists: 5,
    csPerMin: 6.1,
    killParticipation: 0.4,
    goldEarned: 9000,
    totalDamageDealt: 15000,
    visionScore: 14,
  },
  {
    championId: 103,
    championName: "Ahri",
    queueId: 450,
    win: true,
    kills: 15,
    deaths: 5,
    assists: 20,
    csPerMin: 0,
    killParticipation: 0.7,
    goldEarned: 14000,
    totalDamageDealt: 40000,
    visionScore: 5,
  },
  {
    championId: 238,
    championName: "Zed",
    queueId: 440,
    win: true,
    kills: 8,
    deaths: 4,
    assists: 3,
    csPerMin: 8.2,
    killParticipation: 0.45,
    goldEarned: 13000,
    totalDamageDealt: 30000,
    visionScore: 10,
  },
  {
    championId: 238,
    championName: "Zed",
    queueId: 1700,
    win: false,
    kills: 5,
    deaths: 6,
    assists: 2,
    csPerMin: 5.0,
    killParticipation: 0.5,
    goldEarned: 8000,
    totalDamageDealt: 18000,
    visionScore: 3,
  },
  {
    championId: 99,
    championName: "Lux",
    queueId: 420,
    win: true,
    kills: 2,
    deaths: 1,
    assists: 14,
    csPerMin: 6.8,
    killParticipation: 0.65,
    goldEarned: 11000,
    totalDamageDealt: 22000,
    visionScore: 35,
  },
  {
    championId: 99,
    championName: "Lux",
    queueId: 1710,
    win: false,
    kills: 1,
    deaths: 3,
    assists: 5,
    csPerMin: 0,
    killParticipation: 0.3,
    goldEarned: 6000,
    totalDamageDealt: 9000,
    visionScore: 8,
  },
  {
    championId: 99,
    championName: "Lux",
    queueId: 999,
    win: true,
    kills: 4,
    deaths: 2,
    assists: 6,
    csPerMin: 7.0,
    killParticipation: 0.55,
    goldEarned: 10000,
    totalDamageDealt: 20000,
    visionScore: 12,
  },
  {
    championId: null,
    championName: null,
    queueId: 420,
    win: true,
    kills: 1,
    deaths: 1,
    assists: 1,
    csPerMin: 5,
    killParticipation: 0.5,
    goldEarned: 5000,
    totalDamageDealt: 5000,
    visionScore: 5,
  },
]

// ── Reference: the original in-JS reduction (the spec the SQL must match) ──
function emptyBucket(): ChampDetailBucket {
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
function referenceAgg(rows: Seed[]): ChampionDetail[] {
  const byChamp = new Map<number, ChampionDetail>()
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
        aram: emptyBucket(),
        arena: emptyBucket(),
      } satisfies ChampionDetail)
    const add = (b: ChampDetailBucket) => {
      b.games += 1
      b.wins += r.win ? 1 : 0
      b.kills += r.kills
      b.deaths += r.deaths
      b.assists += r.assists
      b.csPerMin += r.csPerMin
      b.kp += r.killParticipation
      b.gold += r.goldEarned
      b.damage += r.totalDamageDealt
      b.vision += r.visionScore
    }
    add(agg.total)
    if (r.queueId === 420) add(agg.solo)
    else if (r.queueId === 440) add(agg.flex)
    else if (r.queueId === 450) add(agg.aram)
    else if (r.queueId === 1700 || r.queueId === 1710) add(agg.arena)
    byChamp.set(r.championId, agg)
  }
  return [...byChamp.values()]
}

const BUCKETS = ["total", "solo", "flex", "aram", "arena"] as const
const INT_FIELDS = [
  "games",
  "wins",
  "kills",
  "deaths",
  "assists",
  "gold",
  "damage",
  "vision",
] as const
const FLOAT_FIELDS = ["csPerMin", "kp"] as const

D("championStatsFromDb (SQL) ≡ original JS reduction", () => {
  beforeAll(async () => {
    await db.delete(summonerMatches).where(eq(summonerMatches.puuid, PUUID))
    await db.insert(summonerMatches).values(SEED.map((s) => ({ ...s, puuid: PUUID })))
  })
  afterAll(async () => {
    await db.delete(summonerMatches).where(eq(summonerMatches.puuid, PUUID))
  })

  it("produces identical per-champion buckets", async () => {
    const actual = await championStatsFromDb(PUUID)
    const expected = referenceAgg(SEED)

    // Compare by championId (tie order isn't part of the contract — consumers re-sort).
    const byId = (xs: ChampionDetail[]) => new Map(xs.map((c) => [c.championId, c]))
    const a = byId(actual)
    const e = byId(expected)

    expect([...a.keys()].sort()).toEqual([...e.keys()].sort())

    for (const [id, exp] of e) {
      const act = a.get(id)
      expect(act, `champion ${id} present`).toBeDefined()
      if (!act) continue
      expect(act.championName).toBe(exp.championName)
      for (const bucket of BUCKETS) {
        for (const f of INT_FIELDS) {
          expect(act[bucket][f], `${id}.${bucket}.${f}`).toBe(exp[bucket][f])
        }
        for (const f of FLOAT_FIELDS) {
          // float sums can differ in the last digits by summation order
          expect(act[bucket][f], `${id}.${bucket}.${f}`).toBeCloseTo(exp[bucket][f], 6)
        }
      }
    }
  })

  it("sorts champions by total games desc", async () => {
    const actual = await championStatsFromDb(PUUID)
    const games = actual.map((c) => c.total.games)
    expect(games).toEqual([...games].sort((x, y) => y - x))
  })
})
