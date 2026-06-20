"use client"

import Link from "next/link"
import { useCrossedPlayers } from "@/hooks/useProfilePanels"

interface Props {
  puuid?: string | null
  region: string
}

export function CrossedPlayers({ puuid, region }: Props) {
  const { data, isLoading } = useCrossedPlayers(puuid)
  const rows = data ?? []

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-medium mb-3">Croisés plusieurs fois</h3>
      {!puuid || (!isLoading && rows.length === 0) ? (
        <p className="text-xs text-muted-foreground py-1">
          Personne pour l'instant — plus tu synchronises, plus on détecte les récurrents.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => {
            const wr = c.encounters > 0 ? Math.round((c.wins / c.encounters) * 100) : 0
            const name = c.gameName || "Joueur"
            const href =
              c.gameName && c.tagLine
                ? `/profile/${region}/${encodeURIComponent(c.gameName)}/${encodeURIComponent(c.tagLine)}`
                : null
            return (
              <div key={c.puuid} className="flex items-center gap-2 text-xs">
                <div className="flex-1 min-w-0">
                  {href ? (
                    <Link href={href} className="font-medium truncate hover:underline">
                      {name}
                    </Link>
                  ) : (
                    <span className="font-medium truncate">{name}</span>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {c.encounters}× · {c.asAlly} allié / {c.asEnemy} ennemi
                  </p>
                </div>
                <span className={`font-semibold ${wr >= 50 ? "text-blue-500" : "text-red-500"}`}>
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
