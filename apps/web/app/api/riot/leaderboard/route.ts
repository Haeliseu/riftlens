import type { ApexTier, Region } from "@riftlens/riot-api"
import { getApexLeague, RiotApiClient } from "@riftlens/riot-api"
import { after, type NextRequest, NextResponse } from "next/server"
import { cacheGet, cacheSet, withCache } from "@/lib/cache"
import { computeLadderId, computeLadderSeason, type LadderSeason } from "@/lib/ladder"

const PAGE = 20
const TIERS: ApexTier[] = ["challenger", "grandmaster", "master"]
const QUEUES = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"]
// Season (top champions) is the costly part (~8 match calls/player) so it's
// enriched in the background, several players per load; the cache persists.
const SEASON_BUDGET = 10
const ID_TTL = 24 * 3600
const SEASON_TTL = 24 * 3600

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
  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  try {
    const league = await withCache(`apex:${region}:${tier}:${queue}`, 3600, () =>
      getApexLeague(client, region, tier, queue)
    )
    const ranked = league.entries
      .filter((e) => e.puuid)
      .sort((a, b) => b.leaguePoints - a.leaguePoints)
    const pageEntries = ranked.slice(offset, offset + PAGE)

    const seasonMisses: string[] = []
    const rows = await Promise.all(
      pageEntries.map(async (e, i) => {
        const puuid = e.puuid as string
        // Identity (name + avatar): cheap, resolved synchronously for everyone.
        const id = await withCache(`lb:id:${region}:${puuid}`, ID_TTL, () =>
          computeLadderId(client, region, puuid)
        ).catch(() => null)
        // Season (top champions): from cache only here; misses filled in the background.
        const season = await cacheGet<LadderSeason>(`lb:season:${region}:${puuid}`)
        if (!season) seasonMisses.push(puuid)
        const games = e.wins + e.losses
        return {
          rank: offset + i + 1,
          puuid,
          gameName: id?.gameName ?? null,
          tagLine: id?.tagLine ?? null,
          profileIconId: id?.profileIconId ?? null,
          leaguePoints: e.leaguePoints,
          wins: e.wins,
          losses: e.losses,
          winRate: games > 0 ? Math.round((e.wins / games) * 100) : 0,
          mainRole: season?.mainRole ?? null,
          topChampions: season?.topChampions ?? [],
        }
      })
    )

    // Backfill season aggregates in the background so the cache fills quickly
    // across loads without slowing the response.
    if (seasonMisses.length > 0) {
      after(async () => {
        for (const puuid of seasonMisses.slice(0, SEASON_BUDGET)) {
          const s = await computeLadderSeason(client, region, puuid).catch(() => null)
          if (s) await cacheSet(`lb:season:${region}:${puuid}`, s, SEASON_TTL)
        }
      })
    }

    return NextResponse.json(
      { tier: league.tier, region, rows, total: ranked.length, offset },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
