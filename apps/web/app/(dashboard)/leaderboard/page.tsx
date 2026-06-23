import type { Metadata } from "next"
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable"
import { getT } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: t("leaderboard.title"),
    description: t("leaderboard.subtitle"),
    alternates: { canonical: "/leaderboard" },
  }
}

export default async function LeaderboardPage() {
  const t = await getT()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("leaderboard.title")}</h1>
        <p className="text-muted-foreground">{t("leaderboard.subtitle")}</p>
      </div>
      <LeaderboardTable />
    </div>
  )
}
