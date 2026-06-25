import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable"
import { localeAlternates } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"
import { regionBadge, regionFromSlug, regionToSlug } from "@/lib/regions"

interface PageProps {
  params: Promise<{ region: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region } = await params
  const id = regionFromSlug(region)
  const t = await getT()
  if (!id) return { title: t("leaderboard.title") }
  const label = regionBadge(id).label
  return {
    title: `${t("leaderboard.title")} — ${label}`,
    description: t("leaderboard.subtitle"),
    alternates: localeAlternates(await getLocale(), `/leaderboard/${regionToSlug(id)}`),
  }
}

export default async function LeaderboardRegionPage({ params }: PageProps) {
  const { region } = await params
  const id = regionFromSlug(region)
  if (!id) notFound()
  const t = await getT()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("leaderboard.title")}</h1>
        <p className="text-muted-foreground">{t("leaderboard.subtitle")}</p>
      </div>
      <LeaderboardTable initialRegion={id} />
    </div>
  )
}
