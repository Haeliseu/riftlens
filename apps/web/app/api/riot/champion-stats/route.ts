import type { ChampionBucket } from "@riftlens/riot-api"
import { getChampionStats } from "@riftlens/riot-api"
import { CACHE, jsonRoute, regionParam, requireParam } from "@/lib/api-route"
import { type ChampDetailBucket, type ChampionDetail, championStatsFromDb } from "@/lib/profile-db"
import { riotClient } from "@/lib/riot-client"

// Map the live (basic) aggregate into the detailed shape (extra fields 0).
function toDetailBucket(b: ChampionBucket): ChampDetailBucket {
  return { ...b, csPerMin: 0, kp: 0, gold: 0, damage: 0, vision: 0 }
}

export const GET = jsonRoute(async (req) => {
  const puuid = requireParam(req, "puuid")
  const region = regionParam(req)
  const count = Math.min(
    40,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("count") ?? "30", 10))
  )

  // Prefer the accumulated DB history (full season); fall back to a live sample
  // when nothing has been ingested yet (or DB/migration unavailable).
  try {
    const fromDb = await championStatsFromDb(puuid)
    if (fromDb.length > 0) {
      return { data: fromDb, cache: "public, s-maxage=120, stale-while-revalidate=600" }
    }
  } catch {
    // DB not ready — fall through to live
  }

  const stats = await getChampionStats(riotClient(), region, puuid, count)
  const empty = (): ChampDetailBucket => ({
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
  })
  const detailed: ChampionDetail[] = stats.map((c) => ({
    championId: c.championId,
    championName: c.championName,
    total: toDetailBucket(c.total),
    solo: toDetailBucket(c.solo),
    flex: toDetailBucket(c.flex),
    aram: empty(),
    arena: empty(),
  }))
  return { data: detailed, cache: CACHE.medium }
})
