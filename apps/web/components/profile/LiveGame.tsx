"use client"

import { getChampionIconUrl, getRankIconUrl, type TierName } from "@riftlens/riot-api"
import { Flame, Radio } from "lucide-react"
import Link from "next/link"
import { type LiveParticipant, useLiveGame } from "@/hooks/useLiveGame"
import { useI18n } from "@/lib/i18n"
import { capitalizeTier, rankLabel } from "@/lib/tiers"

interface LiveGameProps {
  puuid?: string | null
  region: string
}

type T = ReturnType<typeof useI18n>["t"]

function PlayerRow({ p, region, t }: { p: LiveParticipant; region: string; t: T }) {
  const href = p.name.includes("#")
    ? `/profile/${region}/${encodeURIComponent(p.name.split("#")[0] ?? "")}/${encodeURIComponent(
        p.name.split("#")[1] ?? ""
      )}`
    : null
  const rank =
    p.tier && p.division
      ? `${rankLabel(t, p.tier, p.division)} · ${t("history.lp", { value: p.lp ?? 0 })}`
      : t("profile.unranked")
  return (
    <div className="flex items-center gap-2 py-1.5">
      {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
      <img
        src={getChampionIconUrl(p.championId)}
        alt=""
        className="h-8 w-8 rounded-md flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          {href ? (
            <Link href={href} className="text-xs font-medium truncate hover:underline">
              {p.name || t("common.player")}
            </Link>
          ) : (
            <span className="text-xs font-medium truncate">{p.name || "Joueur"}</span>
          )}
          {p.onFire && <Flame className="h-3 w-3 text-orange-400 flex-shrink-0" />}
        </div>
        <p className="text-[10px] text-muted-foreground">{rank}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {p.tier && (
          // biome-ignore lint/performance/noImgElement: external CDN icon
          <img
            src={getRankIconUrl(capitalizeTier(p.tier) as TierName)}
            alt=""
            className="h-5 w-5"
          />
        )}
        <div className="w-12 text-right">
          <p className="text-[11px]">
            <span className="text-green-500">
              {p.recentWins}
              {t("perf.winShort")}
            </span>{" "}
            <span className="text-red-500">
              {p.recentLosses}
              {t("perf.lossShort")}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {p.streak !== 0 ? t("live.streak", { n: Math.abs(p.streak) }) : "—"}
          </p>
        </div>
      </div>
    </div>
  )
}

export function LiveGame({ puuid, region }: LiveGameProps) {
  const { t } = useI18n()
  const { data, isLoading } = useLiveGame(puuid, region)

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        {t("live.loading")}
      </div>
    )
  }
  if (!data) {
    return (
      <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        {t("live.notInGame")}
      </div>
    )
  }

  const blue = data.participants.filter((p) => p.teamId === 100)
  const red = data.participants.filter((p) => p.teamId === 200)
  const minutes = Math.floor(data.gameLengthS / 60)

  return (
    <div className="rounded-xl border border-green-500/40 bg-green-500/5">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-green-500/30">
        <Radio className="h-4 w-4 text-green-500 animate-pulse" />
        <span className="text-sm font-semibold text-green-500">{t("live.inGame")}</span>
        <span className="text-xs text-muted-foreground">{t("live.since", { min: minutes })}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-blue-400 mb-1">{t("live.blueTeam")}</p>
          {blue.map((p) => (
            <PlayerRow key={`${p.puuid}-${p.championId}`} p={p} region={region} t={t} />
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-red-400 mb-1">{t("live.redTeam")}</p>
          {red.map((p) => (
            <PlayerRow key={`${p.puuid}-${p.championId}`} p={p} region={region} t={t} />
          ))}
        </div>
      </div>
    </div>
  )
}
