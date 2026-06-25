import type { Division, RankedEntry, TierName } from "@riftlens/riot-api"
import {
  computeAverageGameRank,
  getAverageGameRank,
  getLeagueEntriesByPuuid,
} from "@riftlens/riot-api"
import { jsonRoute, regionParam, requireParam } from "@/lib/api-route"
import { cachedRanks, cacheParticipantRank, recentParticipantPuuids } from "@/lib/profile-db"
import { riotClient } from "@/lib/riot-client"

function capTier(tier: string): TierName {
  return ((tier[0] ?? "") + tier.slice(1).toLowerCase()) as TierName
}

// Cap how many uncached participant ranks we fetch live per request (rate limits).
const MAX_LIVE_LOOKUPS = 30

export const GET = jsonRoute(async (req) => {
  const puuid = requireParam(req, "puuid")
  const region = regionParam(req)
  const client = riotClient()

  // DB-backed path: participants of the last (up to) 20 stored games, ranks
  // mostly from the shared summoner cache, only missing ones fetched live.
  try {
    const { puuids: participants, games: sampledGames } = await recentParticipantPuuids(puuid, 20)
    if (participants.length > 0) {
      const cache = await cachedRanks(participants)
      const ranks: RankedEntry[] = []
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
        return {
          data: {
            tier,
            division,
            sampleGames: Math.max(1, sampledGames),
            sampledPlayers: ranks.length,
          },
          cache: "public, s-maxage=300, stale-while-revalidate=1800",
        }
      }
    }
  } catch {
    // DB not ready — fall through to a small live sample
  }

  const avg = await getAverageGameRank(client, region, puuid, 3)
  return { data: avg, cache: "public, s-maxage=600, stale-while-revalidate=1800" }
})
