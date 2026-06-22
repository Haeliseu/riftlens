import { db } from "@riftlens/db"
import { profiles } from "@riftlens/db/schema"
import { getLeagueEntriesByPuuid, type Region } from "@riftlens/riot-api"
import { eq, isNotNull } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { ingestProfile } from "@/lib/ingest"
import { riotClient } from "@/lib/riot-client"

// Hourly refresh of every Riot-linked profile (configured in vercel.json crons).
// Vercel sends `Authorization: Bearer ${CRON_SECRET}` on scheduled invocations.
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const linked = await db
    .select({
      id: profiles.id,
      puuid: profiles.riotPuuid,
      region: profiles.region,
      defaultRegion: profiles.defaultRegion,
    })
    .from(profiles)
    .where(isNotNull(profiles.riotPuuid))

  const client = riotClient()
  let refreshed = 0

  for (const p of linked) {
    if (!p.puuid) continue
    const region = (p.region ?? p.defaultRegion ?? "EUW1") as Region
    try {
      const entries = await getLeagueEntriesByPuuid(client, region, p.puuid).catch(() => [])
      const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? null
      const flex = entries.find((e) => e.queueType === "RANKED_FLEX_SR") ?? null
      await ingestProfile(
        region,
        p.puuid,
        solo ? { tier: solo.tier, rank: solo.rank, leaguePoints: solo.leaguePoints } : null,
        flex ? { tier: flex.tier, rank: flex.rank, leaguePoints: flex.leaguePoints } : null
      )
      await db.update(profiles).set({ lastRefreshedAt: new Date() }).where(eq(profiles.id, p.id))
      refreshed++
    } catch {
      // best effort — one bad profile shouldn't fail the whole run
    }
  }

  return NextResponse.json(
    { linked: linked.length, refreshed },
    { headers: { "Cache-Control": "no-store" } }
  )
}
