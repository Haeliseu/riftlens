import { type ApexTier, getApexLeague, type LeagueList } from "@riftlens/riot-api"
import { CACHE, jsonRoute, regionParam, requireParam } from "@/lib/api-route"
import { riotClient } from "@/lib/riot-client"

const APEX: Record<string, ApexTier> = {
  MASTER: "master",
  GRANDMASTER: "grandmaster",
  CHALLENGER: "challenger",
}

function positionInList(list: LeagueList, puuid: string): number | null {
  const sorted = [...list.entries].sort((a, b) => b.leaguePoints - a.leaguePoints)
  const idx = sorted.findIndex((e) => e.puuid === puuid)
  return idx >= 0 ? idx + 1 : null
}

export const GET = jsonRoute(async (req) => {
  const puuid = requireParam(req, "puuid")
  const region = regionParam(req)
  const tier = (req.nextUrl.searchParams.get("tier") ?? "").toUpperCase()
  if (!APEX[tier]) return { data: { rank: null } }

  const client = riotClient()
  const challenger = await getApexLeague(client, region, "challenger")
  let rank: number | null = null
  let total = challenger.entries.length

  if (tier === "CHALLENGER") {
    rank = positionInList(challenger, puuid)
  } else {
    const gm = await getApexLeague(client, region, "grandmaster")
    total += gm.entries.length
    if (tier === "GRANDMASTER") {
      const pos = positionInList(gm, puuid)
      rank = pos != null ? challenger.entries.length + pos : null
    } else {
      const master = await getApexLeague(client, region, "master")
      total += master.entries.length
      const pos = positionInList(master, puuid)
      rank = pos != null ? challenger.entries.length + gm.entries.length + pos : null
    }
  }

  return { data: { rank, apexTotal: total }, cache: CACHE.long }
})
