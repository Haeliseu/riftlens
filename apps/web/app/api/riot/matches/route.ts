import type { RoutingRegion } from "@riftlens/riot-api"
import { getMatchIds, RiotApiClient, SEASON_2_2026_START_MS } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"

const REGION_TO_ROUTING: Record<string, RoutingRegion> = {
  EUW1: "europe",
  EUN1: "europe",
  TR1: "europe",
  RU: "europe",
  NA1: "americas",
  BR1: "americas",
  LA1: "americas",
  LA2: "americas",
  KR: "asia",
  JP1: "asia",
  OC1: "sea",
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = searchParams.get("region") ?? "EUW1"
  const count = parseInt(searchParams.get("count") ?? "20", 10)

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }

  const routing = REGION_TO_ROUTING[region] ?? "europe"
  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  try {
    const matchIds = await getMatchIds(client, routing, puuid, {
      queue: 420, // RANKED_SOLO_5x5
      startTime: SEASON_2_2026_START_MS,
      count,
    })
    return NextResponse.json(matchIds, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
