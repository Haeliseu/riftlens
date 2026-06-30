import type { Metadata } from "next"
import { RunesView } from "@/components/runes/RunesView"
import { localeAlternates } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: t("runes.title"),
    description: t("runes.subtitle"),
    alternates: localeAlternates(await getLocale(), "/runes"),
  }
}

export default async function RunesPage() {
  const t = await getT()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("runes.title")}</h1>
        <p className="text-muted-foreground">{t("runes.subtitle")}</p>
      </div>
      <RunesView />
    </div>
  )
}
