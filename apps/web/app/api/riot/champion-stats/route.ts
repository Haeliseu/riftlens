import type { ChampionBucket, Region } from "@riftlens/riot-api"
import { getChampionStats, RiotApiClient } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { type ChampDetailBucket, type ChampionDetail, championStatsFromDb } from "@/lib/profile-db"

// Map the live (basic) aggregate into the detailed shape (extra fields 0).
function toDetailBucket(b: ChampionBucket): ChampDetailBucket {
  return { ...b, csPerMin: 0, kp: 0, gold: 0, damage: 0, vision: 0 }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = (searchParams.get("region") ?? "EUW1") as Region
  const count = Math.min(40, Math.max(1, parseInt(searchParams.get("count") ?? "30", 10)))

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }

  // Prefer the accumulated DB history (full season); fall back to a live sample
  // when nothing has been ingested yet (or DB/migration unavailable).
  try {
    const fromDb = await championStatsFromDb(puuid)
    if (fromDb.length > 0) {
      return NextResponse.json(fromDb, {
        headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
      })
    }
  } catch {
    // DB not ready — fall through to live
  }

  const client = new RiotApiClient(process.env.RIOT_API_KEY!)
  try {
    const stats = await getChampionStats(client, region, puuid, count)
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
    return NextResponse.json(detailed, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
