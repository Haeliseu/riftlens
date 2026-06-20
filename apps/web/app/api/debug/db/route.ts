import { db } from "@riftlens/db"
import { lpSnapshots, summonerMatches, summoners } from "@riftlens/db/schema"
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"

// Diagnostic only — surfaces DB connectivity/state without leaking secrets.
export async function GET() {
  const raw = process.env.DATABASE_URL
  const info: Record<string, unknown> = {
    hasDatabaseUrl: !!raw,
    urlScheme: raw ? raw.split("://")[0] : null,
    urlHostHint: raw ? (raw.split("@")[1]?.split(":")[0] ?? null) : null,
  }

  try {
    const [s] = await db.select({ n: sql<number>`count(*)` }).from(summoners)
    const [m] = await db.select({ n: sql<number>`count(*)` }).from(summonerMatches)
    const [l] = await db.select({ n: sql<number>`count(*)` }).from(lpSnapshots)
    info.ok = true
    info.counts = {
      summoners: Number(s?.n ?? 0),
      summonerMatches: Number(m?.n ?? 0),
      lpSnapshots: Number(l?.n ?? 0),
    }
  } catch (err) {
    info.ok = false
    info.error = String(err)
  }

  return NextResponse.json(info, { headers: { "Cache-Control": "no-store" } })
}
