import type { Division, RankedEntry, Region, TierName } from "@riftlens/riot-api"
import {
  computeAverageGameRank,
  getAverageGameRank,
  getLeagueEntriesByPuuid,
  RiotApiClient,
} from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { cachedRanks, cacheParticipantRank, recentParticipantPuuids } from "@/lib/profile-db"

function capTier(tier: string): TierName {
  return ((tier[0] ?? "") + tier.slice(1).toLowerCase()) as TierName
}

// Cap how many uncached participant ranks we fetch live per request (rate limits).
const MAX_LIVE_LOOKUPS = 30

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = (searchParams.get("region") ?? "EUW1") as Region

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }

  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  // DB-backed path: participants of the last (up to) 20 stored games, ranks
  // mostly from the shared summoner cache, only missing ones fetched live.
  try {
    const participants = await recentParticipantPuuids(puuid, 20)
    if (participants.length > 0) {
      const cache = await cachedRanks(participants)
      const ranks: RankedEntry[] = []
      let sampledGames = Math.min(20, Math.ceil(participants.length / 10))
      let liveBudget = MAX_LIVE_LOOKUPS

      for (const pid of participants) {
        const cached = cache.get(pid)
        if (cached) {
          ranks.push({
            tier: capTier(cached.tier),
            division: cached.division as Division,
            leaguePoints: cached.leaguePoints,
          })
          continue
        }
        if (liveBudget <= 0) continue
        liveBudget -= 1
        const entries = await getLeagueEntriesByPuuid(client, region, pid).catch(() => [])
        const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5")
        if (solo) {
          await cacheParticipantRank(pid, region, {
            tier: solo.tier,
            division: solo.rank,
            leaguePoints: solo.leaguePoints,
          }).catch(() => {})
          ranks.push({
            tier: capTier(solo.tier),
            division: solo.rank as Division,
            leaguePoints: solo.leaguePoints,
          })
        }
      }

      if (ranks.length > 0) {
        const { tier, division } = computeAverageGameRank(ranks)
        sampledGames = Math.max(1, sampledGames)
        return NextResponse.json(
          { tier, division, sampleGames: sampledGames, sampledPlayers: ranks.length },
          { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } }
        )
      }
    }
  } catch {
    // DB not ready — fall through to a small live sample
  }

  try {
    const avg = await getAverageGameRank(client, region, puuid, 3)
    return NextResponse.json(avg, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
    })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
