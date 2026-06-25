import type { ApexTier, RankedTier, Region } from "@riftlens/riot-api"
import { getApexLeague, getLeagueExpEntries } from "@riftlens/riot-api"
import { after, type NextRequest, NextResponse } from "next/server"
import { cacheGet, cacheSet, withCache } from "@/lib/cache"
import { computeLadderId, computeLadderSeason, type LadderSeason } from "@/lib/ladder"
import { riotClient } from "@/lib/riot-client"

const PAGE = 20
const APEX: ApexTier[] = ["challenger", "grandmaster", "master"]
const NON_APEX: RankedTier[] = [
  "DIAMOND",
  "EMERALD",
  "PLATINUM",
  "GOLD",
  "SILVER",
  "BRONZE",
  "IRON",
]
const DIVISIONS = ["I", "II", "III", "IV"]
const QUEUES = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"]
// One league-exp page (Riot returns a fixed-size page below Master).
const EXP_SIZE = 205
const SEASON_BUDGET = 10
const ID_TTL = 24 * 3600
const SEASON_TTL = 24 * 3600

interface Entry {
  puuid: string
  leaguePoints: number
  wins: number
  losses: number
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const region = (searchParams.get("region") ?? "EUW1") as Region
  const queueParam = searchParams.get("queue") ?? "RANKED_SOLO_5x5"
  const queue = QUEUES.includes(queueParam) ? queueParam : "RANKED_SOLO_5x5"
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10))
  const tierParam = (searchParams.get("tier") ?? "challenger").toLowerCase()
  const client = riotClient()

  const isApex = APEX.includes(tierParam as ApexTier)
  const upper = tierParam.toUpperCase()
  const nonApexTier = NON_APEX.includes(upper as RankedTier) ? (upper as RankedTier) : null

  if (!isApex && !nonApexTier) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  try {
    let pageEntries: Entry[]
    let total: number
    let tierLabel: string

    if (isApex) {
      const tier = tierParam as ApexTier
      const league = await withCache(`apex:${region}:${tier}:${queue}`, 3600, () =>
        getApexLeague(client, region, tier, queue)
      )
      const ranked = league.entries
        .filter((e): e is typeof e & { puuid: string } => !!e.puuid)
        .sort((a, b) => b.leaguePoints - a.leaguePoints)
      pageEntries = ranked.slice(offset, offset + PAGE).map((e) => ({
        puuid: e.puuid,
        leaguePoints: e.leaguePoints,
        wins: e.wins,
        losses: e.losses,
      }))
      total = ranked.length
      tierLabel = league.tier
    } else {
      const tier = nonApexTier as RankedTier
      const division = DIVISIONS.includes(searchParams.get("division") ?? "")
        ? (searchParams.get("division") as string)
        : "I"
      const expPage = Math.floor(offset / EXP_SIZE) + 1
      const raw = await withCache(
        `exp:${region}:${tier}:${division}:${queue}:${expPage}`,
        3600,
        () => getLeagueExpEntries(client, region, queue, tier, division, expPage)
      )
      const sorted = raw
        .filter((e): e is typeof e & { puuid: string } => !!e.puuid)
        .sort((a, b) => b.leaguePoints - a.leaguePoints)
      const localStart = offset - (expPage - 1) * EXP_SIZE
      pageEntries = sorted.slice(localStart, localStart + PAGE).map((e) => ({
        puuid: e.puuid,
        leaguePoints: e.leaguePoints,
        wins: e.wins,
        losses: e.losses,
      }))
      // Page-relative "total" only drives hasNext (offset + rows.length < total).
      const hasMore = localStart + pageEntries.length < sorted.length || sorted.length === EXP_SIZE
      total = hasMore ? offset + pageEntries.length + 1 : offset + pageEntries.length
      tierLabel = `${tier} ${division}`
    }

    const seasonMisses: string[] = []
    const rows = await Promise.all(
      pageEntries.map(async (e, i) => {
        const id = await withCache(`lb:id:${region}:${e.puuid}`, ID_TTL, () =>
          computeLadderId(client, region, e.puuid)
        ).catch(() => null)
        const season = await cacheGet<LadderSeason>(`lb:season:${region}:${e.puuid}`)
        if (!season) seasonMisses.push(e.puuid)
        const games = e.wins + e.losses
        return {
          rank: offset + i + 1,
          puuid: e.puuid,
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

    if (seasonMisses.length > 0) {
      after(async () => {
        for (const puuid of seasonMisses.slice(0, SEASON_BUDGET)) {
          const s = await computeLadderSeason(client, region, puuid).catch(() => null)
          if (s) await cacheSet(`lb:season:${region}:${puuid}`, s, SEASON_TTL)
        }
      })
    }

    return NextResponse.json(
      { tier: tierLabel, region, rows, total, offset },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
