"use client"

import { getChampionIconUrl } from "@riftlens/riot-api"
import { Search } from "lucide-react"
import { useState } from "react"
import { Link } from "@/components/Link"
import { useChampionRotation } from "@/hooks/useChampionRotation"
import { useChampions } from "@/hooks/useChampions"
import { useI18n } from "@/lib/i18n"

export function ChampionGrid() {
  const { t } = useI18n()
  const { data, isLoading, isError } = useChampions()
  const { data: rotation } = useChampionRotation()
  const [q, setQ] = useState("")
  const [freeOnly, setFreeOnly] = useState(false)

  const free = new Set(rotation?.freeChampionIds ?? [])
  const champs = (data ?? [])
    .filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((c) => !freeOnly || free.has(c.id))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("champFilter.searchPlaceholder")}
            className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-sm focus:outline-none"
          />
        </div>
        {free.size > 0 && (
          <button
            type="button"
            onClick={() => setFreeOnly((v) => !v)}
            className={`h-10 rounded-lg border px-3 text-sm font-medium ${
              freeOnly ? "ring-1 ring-primary bg-accent" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {t("champions.freeRotation")}
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("champions.loading")}</p>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">{t("champions.listUnavailable")}</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
          {champs.map((c) => {
            const isFree = free.has(c.id)
            return (
              <Link
                key={c.id}
                href={`/champions/${c.alias}`}
                className="flex flex-col items-center gap-1 rounded-lg p-1 hover:bg-accent"
              >
                <div className="relative">
                  {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                  <img
                    src={getChampionIconUrl(c.id)}
                    alt={c.name}
                    className={`h-14 w-14 rounded-lg border ${isFree ? "ring-2 ring-emerald-400" : ""}`}
                    loading="lazy"
                  />
                  {isFree && (
                    <span className="absolute -top-1 -right-1 rounded bg-emerald-500 px-1 text-[8px] font-bold text-white">
                      {t("champions.freeBadge")}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-center truncate w-full">{c.name}</span>
              </Link>
            )
          })}
          {champs.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">{t("champions.none")}</p>
          )}
        </div>
      )}
    </div>
  )
}
