import { CURRENT_SEASON_LABEL } from "@riftlens/riot-api"

export function SeasonHistory() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-medium mb-3">Historique saisons</h3>
      <div className="text-xs text-muted-foreground">Données {CURRENT_SEASON_LABEL} uniquement</div>
    </div>
  )
}
