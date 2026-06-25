import type { Region } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { buildLiveGame } from "@/lib/live-game"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = (searchParams.get("region") ?? "EUW1") as Region
  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 })

  try {
    const data = await buildLiveGame(puuid, region)
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
