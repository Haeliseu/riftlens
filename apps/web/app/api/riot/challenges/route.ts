import type { Region } from "@riftlens/riot-api"
import { getPlayerChallenges, RiotApiClient } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid")
  const region = (req.nextUrl.searchParams.get("region") ?? "EUW1") as Region
  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  const client = new RiotApiClient(process.env.RIOT_API_KEY!)
  try {
    const data = await getPlayerChallenges(client, region, puuid)
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
