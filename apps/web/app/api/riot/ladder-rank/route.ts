import type { ApexTier, LeagueList, Region } from "@riftlens/riot-api"
import { getApexLeague } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = (searchParams.get("region") ?? "EUW1") as Region
  const tier = (searchParams.get("tier") ?? "").toUpperCase()

  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  if (!APEX[tier]) return NextResponse.json({ rank: null })

  const client = riotClient()

  try {
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

    return NextResponse.json(
      { rank, apexTotal: total },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
