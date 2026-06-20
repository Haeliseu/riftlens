import { ChampionGrid } from "@/components/champions/ChampionGrid"

export default function ChampionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Champions</h1>
        <p className="text-muted-foreground">Tous les champions de League of Legends</p>
      </div>
      <ChampionGrid />
    </div>
  )
}
