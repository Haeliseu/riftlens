import type { Metadata } from "next"
import { FeaturedGamesView } from "@/components/live/FeaturedGamesView"
import { localeAlternates } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: t("featured.title"),
    description: t("featured.subtitle"),
    alternates: localeAlternates(await getLocale(), "/live-games"),
  }
}

export default async function LiveGamesPage() {
  const t = await getT()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("featured.title")}</h1>
        <p className="text-muted-foreground">{t("featured.subtitle")}</p>
      </div>
      <FeaturedGamesView />
    </div>
  )
}
