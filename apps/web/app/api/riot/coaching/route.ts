import { type NextRequest, NextResponse } from "next/server"
import { analyzeCoaching } from "@/lib/coaching"
import { coachingFromDb } from "@/lib/profile-db"

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid")
  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  try {
    const input = await coachingFromDb(puuid)
    if (!input) return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } })
    return NextResponse.json(
      {
        role: input.role,
        games: input.games,
        winRate: input.winRate,
        tips: analyzeCoaching(input),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch {
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } })
  }
}
