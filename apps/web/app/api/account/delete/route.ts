import { db } from "@riftlens/db"
import {
  lpSnapshots,
  matchParticipants,
  profiles,
  rankHistory,
  summonerMatches,
  summoners,
} from "@riftlens/db/schema"
import { eq, sql } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// GDPR "right to erasure": delete the signed-in user's RiftLens profile and the
// Riot data linked to their puuid. Requires an authenticated session.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers }).catch(() => null)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  try {
    const [profile] = await db
      .select({ puuid: profiles.riotPuuid })
      .from(profiles)
      .where(eq(profiles.id, userId))

    const puuid = profile?.puuid
    if (puuid) {
      // Remove the Riot data tied to this account.
      await Promise.allSettled([
        db.delete(lpSnapshots).where(eq(lpSnapshots.puuid, puuid)),
        db.delete(rankHistory).where(eq(rankHistory.puuid, puuid)),
        db.delete(summonerMatches).where(eq(summonerMatches.puuid, puuid)),
        db.delete(matchParticipants).where(eq(matchParticipants.puuid, puuid)),
        db.delete(summoners).where(eq(summoners.puuid, puuid)),
      ])
    }

    // Delete the profile (rune_pages cascade off it), then the Better Auth user
    // (which cascades to its session/account rows).
    await db.delete(profiles).where(eq(profiles.id, userId))
    await db.execute(sql`delete from "user" where id = ${userId}`).catch(() => {})

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
