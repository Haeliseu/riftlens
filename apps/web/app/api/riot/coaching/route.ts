import { type NextRequest, NextResponse } from "next/server"
import { analyzeCoaching } from "@/lib/coaching"
import { cachedRanks, coachingFromDb } from "@/lib/profile-db"

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid")
  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  try {
    const input = await coachingFromDb(puuid)
    if (!input) return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } })
    // Benchmarks scale to the player's rank.
    const tier = (await cachedRanks([puuid]).catch(() => new Map())).get(puuid)?.tier ?? null
    return NextResponse.json(
      {
        role: input.role,
        tier,
        games: input.games,
        winRate: input.winRate,
        tips: analyzeCoaching(input, tier),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch {
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } })
  }
}
