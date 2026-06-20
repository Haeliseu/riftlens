import type { Region } from "@riftlens/riot-api"
import { getLeagueEntriesBySummonerId, RiotApiClient } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const summonerId = searchParams.get("summonerId")
  const region = (searchParams.get("region") ?? "EUW1") as Region

  if (!summonerId) {
    return NextResponse.json({ error: "Missing summonerId" }, { status: 400 })
  }

  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  try {
    const entries = await getLeagueEntriesBySummonerId(client, region, summonerId)
    return NextResponse.json(entries, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
