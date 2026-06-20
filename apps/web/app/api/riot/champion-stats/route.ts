import type { Region } from "@riftlens/riot-api"
import { getChampionStats, RiotApiClient } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { championStatsFromDb } from "@/lib/profile-db"

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
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
