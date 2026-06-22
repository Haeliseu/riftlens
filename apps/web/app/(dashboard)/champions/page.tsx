import { ChampionGrid } from "@/components/champions/ChampionGrid"
import { getT } from "@/lib/i18n/server"

export default async function ChampionsPage() {
  const t = await getT()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("champions.title")}</h1>
        <p className="text-muted-foreground">{t("champions.subtitle")}</p>
      </div>
      <ChampionGrid />
    </div>
  )
}
