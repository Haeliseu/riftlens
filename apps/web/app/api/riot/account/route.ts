import type { RoutingRegion } from "@riftlens/riot-api"
import { getAccountByRiotId } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { riotClient } from "@/lib/riot-client"

const REGION_TO_ROUTING: Record<string, RoutingRegion> = {
  EUW1: "europe",
  EUN1: "europe",
  TR1: "europe",
  RU: "europe",
  NA1: "americas",
  BR1: "americas",
  LA1: "americas",
  LA2: "americas",
  KR: "asia",
  JP1: "asia",
  OC1: "sea",
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const gameName = searchParams.get("gameName")
  const tagLine = searchParams.get("tagLine")
  const region = searchParams.get("region") ?? "EUW1"

  if (!gameName || !tagLine) {
    return NextResponse.json({ error: "Missing gameName or tagLine" }, { status: 400 })
  }

  const routing = REGION_TO_ROUTING[region] ?? "europe"
  const client = riotClient()

  try {
    const account = await getAccountByRiotId(client, routing, gameName, tagLine)
    return NextResponse.json(account, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
