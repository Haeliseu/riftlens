import { getLiveGame, RiotApiClient } from "@riftlens/riot-api"
import type { Region } from "@riftlens/riot-api"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = (searchParams.get("region") ?? "EUW1") as Region

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }

  const client = new RiotApiClient(process.env["RIOT_API_KEY"]!)

  try {
    const liveGame = await getLiveGame(client, region, puuid)
    return NextResponse.json(liveGame, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    })
  } catch (err) {
    const e = err as { status?: number }
    if (e.status === 404) {
      return NextResponse.json(null)
    }
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
