import { ChampionStats } from "@/components/profile/ChampionStats"
import { LpChart } from "@/components/profile/LpChart"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { RankedCard } from "@/components/profile/RankedCard"
import { MatchFilter } from "@/components/match/MatchFilter"
import { MatchHistory } from "@/components/match/MatchHistory"

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

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { region, gameName, tagLine } = await params
  const { opponent, relation, period } = await searchParams

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
