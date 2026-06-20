"use client"

import { useRolePerformance } from "@/hooks/useProfilePanels"

const ROLE_FR: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
  UNKNOWN: "Autre",
}

interface Props {
  puuid?: string | null
}

export function RolePerformance({ puuid }: Props) {
  const { data, isLoading } = useRolePerformance(puuid)
  const rows = (data ?? []).filter((r) => r.games > 0)

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-medium mb-3">Performance par rôle</h3>
      {!puuid || (!isLoading && rows.length === 0) ? (
        <p className="text-xs text-muted-foreground py-1">
          Aucune donnée — clique sur « Actualiser » pour synchroniser.
        </p>
      ) : (
        <div className="space-y-1.5">
          <div className="flex text-[10px] text-muted-foreground uppercase">
            <span className="flex-1">Rôle</span>
            <span className="w-12 text-right">Parties</span>
            <span className="w-12 text-right">WR</span>
          </div>
          {rows.map((r) => {
            const wr = Math.round((r.wins / r.games) * 100)
            return (
              <div key={r.role} className="flex items-center text-xs">
                <span className="flex-1">{ROLE_FR[r.role] ?? r.role}</span>
                <span className="w-12 text-right text-muted-foreground">{r.games}</span>
                <span
                  className={`w-12 text-right font-semibold ${wr >= 50 ? "text-blue-500" : "text-red-500"}`}
                >
                  {wr}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
