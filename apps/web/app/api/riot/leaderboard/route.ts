import type { ApexTier, Region } from "@riftlens/riot-api"
import {
  getAccountByPuuid,
  getApexLeague,
  getSummonerByPuuid,
  RiotApiClient,
  regionToRouting,
} from "@riftlens/riot-api"
import { after, type NextRequest, NextResponse } from "next/server"
import { withCache } from "@/lib/cache"
import { ingestRankedMatches } from "@/lib/ingest"
import { playerSeasonFromDb } from "@/lib/profile-db"

const PAGE = 20
const TIERS: ApexTier[] = ["challenger", "grandmaster", "master"]
const QUEUES = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"]
// How many not-yet-ingested players to backfill per leaderboard load (spreads
// the dev-key rate limit so the ladder fills in over repeated views).
const INGEST_BUDGET = 3

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
    const league = await withCache(`apex:${region}:${tier}:${queue}`, 3600, () =>
      getApexLeague(client, region, tier, queue)
    )
    const ranked = league.entries
      .filter((e) => e.puuid)
      .sort((a, b) => b.leaguePoints - a.leaguePoints)
    const pageEntries = ranked.slice(offset, offset + PAGE)

    const toIngest: string[] = []
    const rows = await Promise.all(
      pageEntries.map(async (e, i) => {
        const puuid = e.puuid as string
        const [acc, summoner, season] = await Promise.all([
          withCache(`acc:${routing}:${puuid}`, 86400, () =>
            getAccountByPuuid(client, routing, puuid)
          ).catch(() => null),
          withCache(`sum:${region}:${puuid}`, 86400, () =>
            getSummonerByPuuid(client, region, puuid)
          ).catch(() => null),
          playerSeasonFromDb(puuid).catch(() => ({ mainRole: null, topChampions: [] })),
        ])
        if (season.topChampions.length === 0 && toIngest.length < INGEST_BUDGET)
          toIngest.push(puuid)
        const games = e.wins + e.losses
        return {
          rank: offset + i + 1,
          puuid,
          gameName: acc?.gameName ?? null,
          tagLine: acc?.tagLine ?? null,
          profileIconId: summoner?.profileIconId ?? null,
          leaguePoints: e.leaguePoints,
          wins: e.wins,
          losses: e.losses,
          winRate: games > 0 ? Math.round((e.wins / games) * 100) : 0,
          mainRole: season.mainRole,
          topChampions: season.topChampions,
        }
      })
    )

    // Backfill a few players' matches so their champions/role appear next time.
    if (toIngest.length > 0) {
      after(async () => {
        for (const puuid of toIngest) {
          await ingestRankedMatches(region, puuid, 15).catch(() => {})
        }
      })
    }

    return NextResponse.json(
      { tier: league.tier, region, rows, total: ranked.length, offset },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
