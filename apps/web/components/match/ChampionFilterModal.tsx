"use client"

import { getChampionIconUrl } from "@riftlens/riot-api"
import { X } from "lucide-react"
import { useState } from "react"
import type { ChampionSummary } from "@/hooks/useChampions"

interface Props {
  champions: ChampionSummary[]
  withChamp: number | null
  againstChamp: number | null
  onWith: (id: number | null) => void
  onAgainst: (id: number | null) => void
  onClose: () => void
}

function ChampionPicker({
  title,
  champions,
  selected,
  onSelect,
}: {
  title: string
  champions: ChampionSummary[]
  selected: number | null
  onSelect: (id: number | null) => void
}) {
  const [q, setQ] = useState("")
  const list = champions.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div className="flex-1 min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {selected != null && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs text-muted-foreground hover:underline"
          >
            Effacer
          </button>
        )}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher…"
        className="mb-2 h-8 w-full rounded-md border bg-card px-2 text-sm focus:outline-none"
      />
      <div className="grid max-h-64 grid-cols-5 gap-1.5 overflow-y-auto sm:grid-cols-6">
        {list.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.name}
            onClick={() => onSelect(selected === c.id ? null : c.id)}
            className={`rounded-md ${selected === c.id ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"}`}
          >
            {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
            <img src={getChampionIconUrl(c.id)} alt={c.name} className="h-9 w-9 rounded-md" />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ChampionFilterModal({
  champions,
  withChamp,
  againstChamp,
  onWith,
  onAgainst,
  onClose,
}: Props) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation on panel */}
      <div
        className="w-full max-w-2xl rounded-xl border bg-card p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Filtrer par champion</h3>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Sélectionne un champion joué <strong>avec</strong> et/ou <strong>contre</strong>. Aucun
          sélectionné = pas de filtre.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <ChampionPicker
            title="Avec (allié)"
            champions={champions}
            selected={withChamp}
            onSelect={onWith}
          />
          <ChampionPicker
            title="Contre (ennemi)"
            champions={champions}
            selected={againstChamp}
            onSelect={onAgainst}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onWith(null)
              onAgainst(null)
            }}
            className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  )
}
