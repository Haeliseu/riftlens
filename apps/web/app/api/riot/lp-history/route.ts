import { type NextRequest, NextResponse } from "next/server"
import { lpHistoryFromDb } from "@/lib/profile-db"

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid")
  const queueId = parseInt(req.nextUrl.searchParams.get("queue") ?? "420", 10)
  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }
  try {
    const points = await lpHistoryFromDb(puuid, queueId)
    return NextResponse.json(points, { headers: { "Cache-Control": "no-store" } })
  } catch {
    // DB/migration not ready — empty history rather than an error
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } })
  }
}
