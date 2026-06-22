import type { Region } from "@riftlens/riot-api"
import { getTopChampionMasteries } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { withCache } from "@/lib/cache"
import { riotClient } from "@/lib/riot-client"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = (searchParams.get("region") ?? "EUW1") as Region

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }

  const client = riotClient()

  try {
    const masteries = await withCache(`mastery:${region}:${puuid}`, 3600, () =>
      getTopChampionMasteries(client, region, puuid, 20)
    )
    return NextResponse.json(masteries, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
