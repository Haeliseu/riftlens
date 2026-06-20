import { db } from "@riftlens/db"
import { summoners } from "@riftlens/db/schema"
import { sql } from "drizzle-orm"
import { MatchFilter } from "@/components/match/MatchFilter"
import { MatchHistory } from "@/components/match/MatchHistory"
import { ChampionStats } from "@/components/profile/ChampionStats"
import { LpChart } from "@/components/profile/LpChart"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { RankedCard } from "@/components/profile/RankedCard"

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

async function indexPlayer(region: string, gameName: string, tagLine: string) {
  const routingMap: Record<string, string> = {
    EUW1: "europe",
    EUN1: "europe",
    TR1: "europe",
    RU: "europe",
    NA1: "americas",
    BR1: "americas",
    LA1: "americas",
    LA2: "americas",
    KR: "asia",
    JP1: "asia",
    OC1: "sea",
  }
  const routing = routingMap[region] ?? "europe"

  try {
    const res = await fetch(
      `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${tagLine}`,
      { headers: { "X-Riot-Token": process.env.RIOT_API_KEY ?? "" }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return
    const account = (await res.json()) as { puuid: string; gameName: string; tagLine: string }

    await db
      .insert(summoners)
      .values({
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,
        region,
      })
      .onConflictDoUpdate({
        target: summoners.puuid,
        set: {
          gameName: account.gameName,
          tagLine: account.tagLine,
          region,
          lastUpdatedAt: sql`now()`,
        },
      })
  } catch {
    // Non-fatal — index best effort
  }
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { region, gameName, tagLine } = await params
  const { opponent, relation, period } = await searchParams

  void indexPlayer(region, decodeURIComponent(gameName), tagLine)

  return (
    <div className="space-y-6">
      <ProfileHeader region={region} gameName={gameName} tagLine={tagLine} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <RankedCard region={region} gameName={gameName} tagLine={tagLine} />
          <LpChart region={region} gameName={gameName} tagLine={tagLine} />
          <ChampionStats region={region} gameName={gameName} tagLine={tagLine} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <MatchFilter />
          <MatchHistory
            region={region}
            gameName={gameName}
            tagLine={tagLine}
            {...(opponent ? { opponentPuuid: opponent } : {})}
            {...(relation ? { opponentRelation: relation } : {})}
            {...(period ? { period } : {})}
          />
        </div>
      </div>
    </div>
  )
}
