import { type NextRequest, NextResponse } from "next/server"
import { pingStatsFromDb } from "@/lib/profile-db"

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid")
  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  try {
    return NextResponse.json(await pingStatsFromDb(puuid), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch {
    return NextResponse.json(
      { total: 0, games: 0, byKey: [] },
      { headers: { "Cache-Control": "no-store" } }
    )
  }
}
