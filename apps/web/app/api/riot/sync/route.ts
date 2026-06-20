import type { Region } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { syncSeason } from "@/lib/ingest"

export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = (searchParams.get("region") ?? "EUW1") as Region

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }

  try {
    const result = await syncSeason(region, puuid)
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
