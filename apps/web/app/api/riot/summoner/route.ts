import { getSummonerByPuuid, RiotApiClient } from "@riftlens/riot-api"
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
    const summoner = await getSummonerByPuuid(client, region, puuid)
    return NextResponse.json(summoner, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
