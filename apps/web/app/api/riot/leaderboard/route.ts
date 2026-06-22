import type { ApexTier, Region } from "@riftlens/riot-api"
import {
  getAccountByPuuid,
  getApexLeague,
  RiotApiClient,
  regionToRouting,
} from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"

const PAGE = 20
const TIERS: ApexTier[] = ["challenger", "grandmaster", "master"]
const QUEUES = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"]

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const region = (searchParams.get("region") ?? "EUW1") as Region
  const tierParam = searchParams.get("tier") ?? "challenger"
  const tier: ApexTier = TIERS.includes(tierParam as ApexTier)
    ? (tierParam as ApexTier)
    : "challenger"
  const queueParam = searchParams.get("queue") ?? "RANKED_SOLO_5x5"
  const queue = QUEUES.includes(queueParam) ? queueParam : "RANKED_SOLO_5x5"
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10))
  const routing = regionToRouting(region)
  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  try {
    const league = await getApexLeague(client, region, tier, queue)
    const ranked = league.entries
      .filter((e) => e.puuid)
      .sort((a, b) => b.leaguePoints - a.leaguePoints)
    const pageEntries = ranked.slice(offset, offset + PAGE)

    const rows = await Promise.all(
      pageEntries.map(async (e, i) => {
        const acc = await getAccountByPuuid(client, routing, e.puuid as string).catch(() => null)
        const games = e.wins + e.losses
        return {
          rank: offset + i + 1,
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
      { tier: league.tier, region, rows, total: ranked.length, offset },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
