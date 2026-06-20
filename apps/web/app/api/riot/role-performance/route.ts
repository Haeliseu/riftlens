import { type NextRequest, NextResponse } from "next/server"
import { rolePerformanceFromDb } from "@/lib/profile-db"

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid")
  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  try {
    return NextResponse.json(await rolePerformanceFromDb(puuid), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } })
  }
}
