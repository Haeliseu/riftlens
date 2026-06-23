"use client"

import { getProfileIconUrl } from "@riftlens/riot-api"
import { Link } from "@/components/Link"
import { useCrossedPlayers } from "@/hooks/useProfilePanels"
import { useI18n } from "@/lib/i18n"

interface Props {
  puuid?: string | null
  region: string
}

export function CrossedPlayers({ puuid, region }: Props) {
  const { t } = useI18n()
  const { data, isLoading } = useCrossedPlayers(puuid, region)
  const rows = data ?? []

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-base font-semibold mb-3">{t("crossed.title")}</h3>
      {!puuid || (!isLoading && rows.length === 0) ? (
        <p className="text-sm text-muted-foreground py-1">{t("crossed.empty")}</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((c) => {
            const wr = c.encounters > 0 ? Math.round((c.wins / c.encounters) * 100) : 0
            const name = c.gameName || t("common.player")
            const href =
              c.gameName && c.tagLine
                ? `/profile/${region}/${encodeURIComponent(c.gameName)}/${encodeURIComponent(c.tagLine)}`
                : null
            return (
              <div key={c.puuid} className="flex items-center gap-2.5 text-sm">
                <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                  {c.profileIconId != null && (
                    // biome-ignore lint/performance/noImgElement: external CDN icon
                    <img
                      src={getProfileIconUrl(c.profileIconId)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {href ? (
                    <Link href={href} className="font-medium truncate hover:underline">
                      {name}
                    </Link>
                  ) : (
                    <span className="font-medium truncate">{name}</span>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("roles.games", { n: c.encounters })}
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
