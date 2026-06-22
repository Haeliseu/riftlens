import type { Region } from "@riftlens/riot-api"
import { getProfileSummary } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { withCache } from "@/lib/cache"
import { riotClient } from "@/lib/riot-client"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const gameName = searchParams.get("gameName")
  const tagLine = searchParams.get("tagLine")
  const region = (searchParams.get("region") ?? "EUW1") as Region

  if (!gameName || !tagLine) {
    return NextResponse.json({ error: "Missing gameName or tagLine" }, { status: 400 })
  }

  const client = riotClient()

  try {
    const summary = await withCache(
      `ps:${region}:${gameName.toLowerCase()}:${tagLine.toLowerCase()}`,
      300,
      () => getProfileSummary(client, region, gameName, tagLine)
    )
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
