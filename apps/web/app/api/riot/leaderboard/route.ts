import type { Region } from "@riftlens/riot-api"
import {
  getAccountByPuuid,
  getApexLeague,
  RiotApiClient,
  regionToRouting,
} from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"

const TOP_N = 20

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const region = (searchParams.get("region") ?? "EUW1") as Region
  const routing = regionToRouting(region)
  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  try {
    const league = await getApexLeague(client, region, "challenger")
    const top = league.entries
      .sort((a, b) => b.leaguePoints - a.leaguePoints)
      .slice(0, TOP_N)
      .filter((e) => e.puuid)

    const rows = await Promise.all(
      top.map(async (e, i) => {
        const acc = await getAccountByPuuid(client, routing, e.puuid as string).catch(() => null)
        const games = e.wins + e.losses
        return {
          rank: i + 1,
          gameName: acc?.gameName ?? null,
          tagLine: acc?.tagLine ?? null,
          leaguePoints: e.leaguePoints,
          wins: e.wins,
          losses: e.losses,
          winRate: games > 0 ? Math.round((e.wins / games) * 100) : 0,
        }
      })
    )

    return NextResponse.json(
      { tier: league.tier, region, rows },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
