import { getProfileSummary, type Region } from "@riftlens/riot-api"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { Link } from "@/components/Link"
import { LiveGame } from "@/components/profile/LiveGame"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { localePath } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"
import { buildLiveGame } from "@/lib/live-game"
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
 * Resolves the player then builds the live game server-side, so the data is
 * ready on first paint. Wrapped in <Suspense> by the page → the shell streams
 * immediately while this awaits Riot.
 */
async function LiveSection({ region, name, tag }: { region: string; name: string; tag: string }) {
  const t = await getT()

  let summary: Awaited<ReturnType<typeof getProfileSummary>> | null = null
  try {
    summary = await getProfileSummary(riotClient(), region as Region, name, tag)
  } catch {
    // Bad key / unknown player → render the shell below.
  }
  if (!summary) return <Card>{t("profile.noData", { name, region })}</Card>

  const data = await buildLiveGame(summary.puuid, region as Region).catch(() => null)

  return (
    <div className="space-y-6">
      <ProfileHeader
        region={region}
        gameName={summary.gameName}
        tagLine={summary.tagLine}
        profileIconId={summary.profileIconId}
        summonerLevel={summary.summonerLevel}
      />
      <LiveGame region={region} puuid={summary.puuid} initialData={data} />
    </div>
  )
}

export default async function LivePage({ params }: LivePageProps) {
  const { region, gameName, tagLine } = await params
  const t = await getT()
  const name = safeDecode(gameName)
  const tag = safeDecode(tagLine)
  const profilePath = `/profile/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`

  return (
    <div className="space-y-6">
      <Link
        href={profilePath}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("live.backToProfile")}
      </Link>

      <Suspense fallback={<Card>{t("live.loading")}</Card>}>
        <LiveSection region={region} name={name} tag={tag} />
      </Suspense>
    </div>
  )
}
