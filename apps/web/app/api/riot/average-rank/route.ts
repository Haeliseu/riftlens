import type { Region } from "@riftlens/riot-api"
import { getAverageGameRank, RiotApiClient } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = (searchParams.get("region") ?? "EUW1") as Region
  const games = Math.min(5, Math.max(1, parseInt(searchParams.get("games") ?? "3", 10)))

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }

  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  try {
    const avg = await getAverageGameRank(client, region, puuid, games)
    return NextResponse.json(avg, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
    })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
