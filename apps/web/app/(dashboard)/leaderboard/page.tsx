import type { Metadata } from "next"
import { cookies } from "next/headers"
import { LB_REGION_COOKIE, LeaderboardTable } from "@/components/leaderboard/LeaderboardTable"
import { localeAlternates } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"
import { regionFromSlug } from "@/lib/regions"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: t("leaderboard.title"),
    description: t("leaderboard.subtitle"),
    alternates: localeAlternates(await getLocale(), "/leaderboard"),
  }
}

export default async function LeaderboardPage() {
  const t = await getT()
  // Restore the last region the user looked at (cookie), else default to EUW.
  const saved = (await cookies()).get(LB_REGION_COOKIE)?.value
  const initialRegion = (saved && regionFromSlug(saved)) || "EUW1"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("leaderboard.title")}</h1>
        <p className="text-muted-foreground">{t("leaderboard.subtitle")}</p>
      </div>
      <LeaderboardTable initialRegion={initialRegion} />
    </div>
  )
}
