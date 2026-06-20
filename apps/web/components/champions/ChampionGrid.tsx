"use client"

import { getChampionIconUrl } from "@riftlens/riot-api"
import { Search } from "lucide-react"
import { useState } from "react"
import { useChampions } from "@/hooks/useChampions"

export function ChampionGrid() {
  const { data, isLoading, isError } = useChampions()
  const [q, setQ] = useState("")

  const champs = (data ?? []).filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un champion…"
          className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-sm focus:outline-none"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des champions…</p>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Liste indisponible.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
          {champs.map((c) => (
            <div key={c.id} className="flex flex-col items-center gap-1">
              {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
              <img
                src={getChampionIconUrl(c.id)}
                alt={c.name}
                className="h-14 w-14 rounded-lg border"
                loading="lazy"
              />
              <span className="text-[11px] text-center truncate w-full">{c.name}</span>
            </div>
          ))}
          {champs.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">Aucun champion.</p>
          )}
        </div>
      )}
    </div>
  )
}
