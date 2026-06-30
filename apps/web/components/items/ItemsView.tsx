"use client"

import { Search, X } from "lucide-react"
import { useMemo, useState } from "react"
import { type DdItem, useItems } from "@/hooks/useItems"
import { cleanDdragon, itemIconUrl } from "@/lib/ddragon"
import { useI18n } from "@/lib/i18n"

export function ItemsView() {
  const { t, locale } = useI18n()
  const { data, isLoading, isError } = useItems(locale)
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<DdItem | null>(null)

  const byId = useMemo(() => new Map((data?.items ?? []).map((it) => [it.id, it])), [data])
  const filtered = (data?.items ?? []).filter((it) =>
    it.name.toLowerCase().includes(q.trim().toLowerCase())
  )
  const version = data?.version ?? ""

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
  if (isError || !data)
    return <p className="text-sm text-muted-foreground">{t("items.unavailable")}</p>

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("items.search")}
          className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-sm focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
        {filtered.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setSelected(it)}
            className="flex flex-col items-center gap-1 rounded-lg p-1.5 text-center hover:bg-accent"
          >
            {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
            <img
              src={itemIconUrl(version, it.image.full)}
              alt={it.name}
              className="h-11 w-11 rounded-md border"
              loading="lazy"
            />
            <span className="line-clamp-2 text-[10px] leading-tight">{it.name}</span>
            <span className="text-[10px] font-medium text-amber-500">{it.gold.total}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">{t("items.none")}</p>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
          onKeyDown={() => {}}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={() => {}}
            role="dialog"
            aria-modal="true"
            aria-label={selected.name}
          >
            <div className="mb-3 flex items-start gap-3">
              {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
              <img
                src={itemIconUrl(version, selected.image.full)}
                alt=""
                className="h-12 w-12 rounded-md border"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{selected.name}</p>
                <p className="text-xs text-amber-500">
                  {t("items.gold", { total: selected.gold.total, sell: selected.gold.sell })}
                </p>
              </div>
              <button
                type="button"
                aria-label={t("status.close")}
                onClick={() => setSelected(null)}
                className="rounded p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {cleanDdragon(selected.description)}
            </p>

            {selected.from && selected.from.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {t("items.buildsFrom")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.from.map((fid, i) => {
                    const f = byId.get(fid)
                    return f ? (
                      <button
                        // biome-ignore lint/suspicious/noArrayIndexKey: same component can appear twice
                        key={`${fid}-${i}`}
                        type="button"
                        onClick={() => setSelected(f)}
                        title={f.name}
                      >
                        {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                        <img
                          src={itemIconUrl(version, f.image.full)}
                          alt={f.name}
                          className="h-8 w-8 rounded border"
                        />
                      </button>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
