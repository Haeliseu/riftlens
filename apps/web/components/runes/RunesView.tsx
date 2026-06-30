"use client"

import { useRunes } from "@/hooks/useRunes"
import { cleanDdragon, runeIconUrl } from "@/lib/ddragon"
import { useI18n } from "@/lib/i18n"

export function RunesView() {
  const { t, locale } = useI18n()
  const { data: trees, isLoading, isError } = useRunes(locale)

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
  if (isError || !trees)
    return <p className="text-sm text-muted-foreground">{t("runes.unavailable")}</p>

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {trees.map((tree) => (
        <section key={tree.id} className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
            <img src={runeIconUrl(tree.icon)} alt="" className="h-7 w-7" />
            <h2 className="text-lg font-semibold">{tree.name}</h2>
          </div>
          <div className="space-y-3">
            {tree.slots.map((slot, si) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed slot order
                key={si}
                className="flex flex-wrap gap-2"
              >
                {slot.runes.map((rune) => (
                  <div
                    key={rune.id}
                    title={cleanDdragon(rune.shortDesc)}
                    className="flex items-center gap-2 rounded-lg border bg-background/40 p-1.5"
                  >
                    {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                    <img
                      src={runeIconUrl(rune.icon)}
                      alt=""
                      className={`flex-shrink-0 ${si === 0 ? "h-9 w-9" : "h-7 w-7"}`}
                      loading="lazy"
                    />
                    <span className="text-xs font-medium">{rune.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
