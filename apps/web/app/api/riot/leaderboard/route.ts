import type { ApexTier, Region } from "@riftlens/riot-api"
import { getApexLeague, RiotApiClient } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { cacheGet, cacheSet, withCache } from "@/lib/cache"
import { computeLadderPlayer, type LadderPlayer } from "@/lib/ladder"

const PAGE = 20
const TIERS: ApexTier[] = ["challenger", "grandmaster", "master"]
const QUEUES = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"]
// How many not-yet-cached players to enrich live per load (the rest fill in on
// later loads). Each one costs ~12 Riot calls, so keep it small.
const ENRICH_BUDGET = 3
const PLAYER_TTL = 24 * 3600

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

    let budget = ENRICH_BUDGET
    const rows = await Promise.all(
      pageEntries.map(async (e, i) => {
        const puuid = e.puuid as string
        const key = `lb:p:${region}:${puuid}`
        let player = await cacheGet<LadderPlayer>(key)
        if (!player && budget > 0) {
          budget -= 1
          player = await computeLadderPlayer(client, region, puuid).catch(() => null)
          if (player) await cacheSet(key, player, PLAYER_TTL)
        }
        const games = e.wins + e.losses
        return {
          rank: offset + i + 1,
          puuid,
          gameName: player?.gameName ?? null,
          tagLine: player?.tagLine ?? null,
          profileIconId: player?.profileIconId ?? null,
          leaguePoints: e.leaguePoints,
          wins: e.wins,
          losses: e.losses,
          winRate: games > 0 ? Math.round((e.wins / games) * 100) : 0,
          mainRole: player?.mainRole ?? null,
          topChampions: player?.topChampions ?? [],
        }
      })
    )

    return NextResponse.json(
      { tier: league.tier, region, rows, total: ranked.length, offset },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
