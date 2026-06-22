import { db } from "@riftlens/db"
import { summoners } from "@riftlens/db/schema"
import {
  getProfileSummary,
  type ProfileSummary,
  type Region,
  RiotApiClient,
} from "@riftlens/riot-api"
import { sql } from "drizzle-orm"
import { after } from "next/server"
import { MatchHistory } from "@/components/match/MatchHistory"
import { ChampionPerformance } from "@/components/profile/ChampionPerformance"
import { ChampionStats } from "@/components/profile/ChampionStats"
import { CrossedPlayers } from "@/components/profile/CrossedPlayers"
import { FlexCard } from "@/components/profile/FlexCard"
import { LiveGame } from "@/components/profile/LiveGame"
import { PingStats } from "@/components/profile/PingStats"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { ProfileTabs } from "@/components/profile/ProfileTabs"
import { RankedCard } from "@/components/profile/RankedCard"
import { RefreshButton } from "@/components/profile/RefreshButton"
import { RolePerformance } from "@/components/profile/RolePerformance"
import { getT } from "@/lib/i18n/server"
import { ingestProfile } from "@/lib/ingest"

interface ProfilePageProps {
  params: Promise<{
    region: string
    gameName: string
    tagLine: string
  }>
}

/** Best-effort cache of the player into our DB so name-only search can find them later. */
async function indexSummoner(region: string, summary: ProfileSummary) {
  try {
    await db
      .insert(summoners)
      .values({
        puuid: summary.puuid,
        gameName: summary.gameName,
        tagLine: summary.tagLine,
        region,
        profileIconId: summary.profileIconId,
        summonerLevel: summary.summonerLevel,
      })
      .onConflictDoUpdate({
        target: summoners.puuid,
        set: {
          gameName: summary.gameName,
          tagLine: summary.tagLine,
          region,
          profileIconId: summary.profileIconId,
          summonerLevel: summary.summonerLevel,
          lastUpdatedAt: sql`now()`,
        },
      })
  } catch {
    // Non-fatal — index best effort
  }
}

/** Route params may arrive percent-encoded; decode once, tolerate already-decoded. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { region, gameName, tagLine } = await params
  const t = await getT()

  const name = safeDecode(gameName)
  const tag = safeDecode(tagLine)

  const client = new RiotApiClient(process.env.RIOT_API_KEY ?? "")
  let summary: ProfileSummary | null = null
  try {
    summary = await getProfileSummary(client, region as Region, name, tag)
    const s = summary
    // Persist after the response is sent — `after()` keeps the serverless
    // function alive on Vercel (a bare `void` promise would be frozen/killed).
    after(async () => {
      await indexSummoner(region, s)
      await ingestProfile(region as Region, s.puuid, s.soloRank).catch(() => {})
    })
  } catch {
    // Riot lookup failed (bad key / unknown player) — render shells
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <ProfileHeader
          region={region}
          gameName={name}
          tagLine={tag}
          profileIconId={summary?.profileIconId ?? null}
          summonerLevel={summary?.summonerLevel ?? null}
          soloRank={summary?.soloRank ?? null}
        />
        {summary && <RefreshButton puuid={summary.puuid} region={region} />}
      </div>

      {!summary && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          {t("profile.noData", { name, region })}
        </div>
      )}

      {summary && (
        <ProfileTabs
          overview={
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-1 space-y-4">
                <RankedCard region={region} puuid={summary.puuid} soloRank={summary.soloRank} />
                <FlexCard region={region} puuid={summary.puuid} flexRank={summary.flexRank} />
                <ChampionPerformance puuid={summary.puuid} region={region} />
                <RolePerformance puuid={summary.puuid} />
                <CrossedPlayers puuid={summary.puuid} region={region} />
                <PingStats puuid={summary.puuid} />
              </div>
              <div className="lg:col-span-2 space-y-4">
                <MatchHistory region={region} puuid={summary.puuid} />
              </div>
            </div>
          }
          champions={<ChampionStats region={region} puuid={summary.puuid} />}
          live={<LiveGame puuid={summary.puuid} region={region} />}
        />
      )}
    </div>
  )
}
