import { db } from "@riftlens/db"
import { summoners } from "@riftlens/db/schema"
import { ilike, sql } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  const region = req.nextUrl.searchParams.get("region")

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const rows = await db
    .select({
      gameName: summoners.gameName,
      tagLine: summoners.tagLine,
      region: summoners.region,
      profileIconId: summoners.profileIconId,
      summonerLevel: summoners.summonerLevel,
    })
    .from(summoners)
    .where(
      region
        ? sql`${ilike(summoners.gameName, `${q}%`)} and ${summoners.region} = ${region}`
        : ilike(summoners.gameName, `${q}%`)
    )
    .orderBy(sql`lower(${summoners.gameName})`)
    .limit(8)

  return NextResponse.json(rows, {
    headers: { "Cache-Control": "no-store" },
  })
}
