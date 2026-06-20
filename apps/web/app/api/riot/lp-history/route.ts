import { type NextRequest, NextResponse } from "next/server"
import { lpHistoryFromDb } from "@/lib/profile-db"

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid")
  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }
  try {
    const points = await lpHistoryFromDb(puuid)
    return NextResponse.json(points, { headers: { "Cache-Control": "no-store" } })
  } catch {
    // DB/migration not ready — empty history rather than an error
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } })
  }
}
