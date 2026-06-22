import type { Region } from "@riftlens/riot-api"
import { getChampionRotation, RiotApiClient } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const region = (req.nextUrl.searchParams.get("region") ?? "EUW1") as Region
  const client = new RiotApiClient(process.env.RIOT_API_KEY!)
  try {
    const rotation = await getChampionRotation(client, region)
    return NextResponse.json(rotation, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
