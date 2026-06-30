import type { Metadata } from "next"
import { ItemsView } from "@/components/items/ItemsView"
import { localeAlternates } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: t("items.title"),
    description: t("items.subtitle"),
    alternates: localeAlternates(await getLocale(), "/items"),
  }
}

export default async function ItemsPage() {
  const t = await getT()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("items.title")}</h1>
        <p className="text-muted-foreground">{t("items.subtitle")}</p>
      </div>
      <ItemsView />
    </div>
  )
}
