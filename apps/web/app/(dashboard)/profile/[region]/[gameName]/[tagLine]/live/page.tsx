import { getProfileSummary, type Region } from "@riftlens/riot-api"
import type { Metadata } from "next"
import { Suspense } from "react"
import { LiveGame } from "@/components/profile/LiveGame"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { ProfileTabBar } from "@/components/profile/ProfileTabBar"
import { localePath } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"
import { detectLiveGame } from "@/lib/live-game"
import { riotClient } from "@/lib/riot-client"

interface LivePageProps {
  params: Promise<{ region: string; gameName: string; tagLine: string }>
}

/** Route params may arrive percent-encoded; decode once, tolerate already-decoded. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export async function generateMetadata({ params }: LivePageProps): Promise<Metadata> {
  const { region, gameName, tagLine } = await params
  const t = await getT()
  const name = safeDecode(gameName)
  const tag = safeDecode(tagLine)
  const riotId = `${name} #${tag}`
  const path = `/profile/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}/live`
  return {
    title: `${t("live.title")} — ${riotId}`,
    alternates: { canonical: localePath(await getLocale(), path) },
    // Per-game, ephemeral — keep it out of the index.
    robots: { index: false, follow: true },
  }
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

/**
 * Resolves the player and detects (fast) whether they're in a game, then
 * renders the profile header + tab bar (Live active) with the live game below.
 * When in a game, the cards paint immediately from the detected data and the
 * client enriches them (rank/form) — so the loading is visible.
 */
async function LiveSection({
  region,
  basePath,
  name,
  tag,
}: {
  region: string
  basePath: string
  name: string
  tag: string
}) {
  const t = await getT()

  let summary: Awaited<ReturnType<typeof getProfileSummary>> | null = null
  try {
    summary = await getProfileSummary(riotClient(), region as Region, name, tag)
  } catch {
    // Bad key / unknown player → render the shell below.
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <ProfileHeader region={region} gameName={name} tagLine={tag} />
        <ProfileTabBar active="live" basePath={basePath} />
        <Card>{t("profile.noData", { name, region })}</Card>
      </div>
    )
  }

  const detected = await detectLiveGame(summary.puuid, region as Region).catch(() => null)

  return (
    <div className="space-y-6">
      <ProfileHeader
        region={region}
        gameName={summary.gameName}
        tagLine={summary.tagLine}
        profileIconId={summary.profileIconId}
        summonerLevel={summary.summonerLevel}
      />
      <ProfileTabBar active="live" basePath={basePath} />
      {detected ? (
        <LiveGame region={region} puuid={summary.puuid} initialBasic={detected} />
      ) : (
        <Card>{t("live.notInGame")}</Card>
      )}
    </div>
  )
}

export default async function LivePage({ params }: LivePageProps) {
  const { region, gameName, tagLine } = await params
  const t = await getT()
  const name = safeDecode(gameName)
  const tag = safeDecode(tagLine)
  const basePath = `/profile/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`

  return (
    <div className="space-y-6">
      <Suspense fallback={<Card>{t("live.loading")}</Card>}>
        <LiveSection region={region} basePath={basePath} name={name} tag={tag} />
      </Suspense>
    </div>
  )
}
