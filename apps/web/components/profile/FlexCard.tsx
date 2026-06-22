"use client"

import { getRankEmblemUrl, type TierName } from "@riftlens/riot-api"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { useI18n } from "@/lib/i18n"
import { capitalizeTier, rankLabel, tierColor } from "@/lib/tiers"
import { LpChart } from "./LpChart"
import type { SoloRank } from "./RankedCard"

interface FlexCardProps {
  region: string
  puuid?: string | null
  flexRank?: SoloRank | null
}

export function FlexCard({ region, puuid, flexRank }: FlexCardProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const games = flexRank ? flexRank.wins + flexRank.losses : 0
  const winRate = games > 0 ? Math.round(((flexRank?.wins ?? 0) / games) * 100) : null
  const color = flexRank ? tierColor(flexRank.tier) : undefined
  const label = flexRank ? rankLabel(t, flexRank.tier, flexRank.rank) : t("profile.unranked")

  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="text-xs text-muted-foreground">{t("ranked.flex")}</span>
        {flexRank && (
          <span className="text-sm font-bold" style={{ color }}>
            {label}
          </span>
        )}
        {flexRank && (
          <span className="text-xs text-muted-foreground">
            {t("history.lp", { value: flexRank.leaguePoints })}
          </span>
        )}
        <ChevronDown
          className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-4 mb-2">
            {flexRank ? (
              <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden">
                {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                <img
                  src={getRankEmblemUrl(capitalizeTier(flexRank.tier) as TierName)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain scale-[3.4] drop-shadow"
                />
              </div>
            ) : (
              <div className="h-28 w-28 flex items-center justify-center text-5xl text-muted-foreground">
                —
              </div>
            )}
            <div>
              <p className="text-xl font-bold" style={{ color }}>
                {label}
              </p>
              {flexRank && (
                <p className="text-sm text-muted-foreground font-mono">
                  {t("history.lp", { value: flexRank.leaguePoints })}
                </p>
              )}
            </div>
          </div>

          {winRate != null && flexRank && (
            <>
              <p className="text-xs text-muted-foreground mb-1.5">
                {t("ranked.wlLine", {
                  wins: flexRank.wins,
                  losses: flexRank.losses,
                  wr: winRate,
                  games,
                })}
              </p>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, flexRank.leaguePoints)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </>
          )}

          <LpChart embedded puuid={puuid ?? null} region={region} queueId={440} />
        </div>
      )}
    </div>
  )
}
