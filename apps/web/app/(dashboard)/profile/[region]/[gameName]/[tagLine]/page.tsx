import { db } from "@riftlens/db"
import { summoners } from "@riftlens/db/schema"
import {
  getProfileSummary,
  type ProfileSummary,
  type Region,
  RiotApiClient,
} from "@riftlens/riot-api"
import { sql } from "drizzle-orm"
import { MatchFilter } from "@/components/match/MatchFilter"
import { MatchHistory } from "@/components/match/MatchHistory"
import { ChampionStats } from "@/components/profile/ChampionStats"
import { CrossedPlayers } from "@/components/profile/CrossedPlayers"
import { LpChart } from "@/components/profile/LpChart"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { RankedCard } from "@/components/profile/RankedCard"
import { RefreshButton } from "@/components/profile/RefreshButton"
import { RolePerformance } from "@/components/profile/RolePerformance"
import { ingestProfile } from "@/lib/ingest"

interface ProfilePageProps {
  params: Promise<{
    region: string
    gameName: string
    tagLine: string
  }>
  searchParams: Promise<{
    opponent?: string
    relation?: "ally" | "enemy" | "both"
    period?: "all" | "day" | "session"
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

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { region, gameName, tagLine } = await params
  const { opponent, relation, period } = await searchParams

  const name = safeDecode(gameName)
  const tag = safeDecode(tagLine)

  const client = new RiotApiClient(process.env.RIOT_API_KEY ?? "")
  let summary: ProfileSummary | null = null
  try {
    summary = await getProfileSummary(client, region as Region, name, tag)
    const s = summary
    // Best-effort persistence: ensure the row exists (name/icon/level), then
    // ingest matches + LP snapshot + rank cache. Never blocks rendering.
    void indexSummoner(region, s).then(() =>
      ingestProfile(region as Region, s.puuid, s.soloRank).catch(() => {})
    )
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
          Aucune donnée Riot pour <strong>{name}</strong> sur <strong>{region}</strong>. Vérifie la
          région (le compte joue peut-être sur une autre) ou la validité de la clé API Riot.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <RankedCard
            region={region}
            puuid={summary?.puuid ?? null}
            soloRank={summary?.soloRank ?? null}
          />
          <LpChart region={region} gameName={name} tagLine={tag} puuid={summary?.puuid ?? null} />
          <ChampionStats region={region} puuid={summary?.puuid ?? null} />
          <RolePerformance puuid={summary?.puuid ?? null} />
          <CrossedPlayers puuid={summary?.puuid ?? null} region={region} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <MatchFilter />
          <MatchHistory
            region={region}
            gameName={name}
            tagLine={tag}
            puuid={summary?.puuid ?? null}
            {...(opponent ? { opponentPuuid: opponent } : {})}
            {...(relation ? { opponentRelation: relation } : {})}
            {...(period ? { period } : {})}
          />
        </div>
      </div>
    </div>
  )
}
