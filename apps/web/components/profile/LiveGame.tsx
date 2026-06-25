"use client"

import {
  getChampionIconUrl,
  getRankIconUrl,
  type PlayerTag,
  type TierName,
} from "@riftlens/riot-api"
import { Flame, Radio } from "lucide-react"
import { Link } from "@/components/Link"
import { type LiveGameData, type LiveParticipant, useLiveGame } from "@/hooks/useLiveGame"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { capitalizeTier, rankLabel } from "@/lib/tiers"

const TAG_META: Record<PlayerTag, { emoji: string; label: TranslationKey }> = {
  "on-fire": { emoji: "🔥", label: "live.tag.onFire" },
  "one-trick": { emoji: "🎯", label: "live.tag.oneTrick" },
  "carry-potential": { emoji: "💪", label: "live.tag.carry" },
  "fed-last-game": { emoji: "🏆", label: "live.tag.fed" },
}

interface LiveGameProps {
  puuid?: string | null
  region: string
  initialData?: LiveGameData | null
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
    <div className="flex items-center gap-2.5 py-2">
      {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
      <img
        src={getChampionIconUrl(p.championId)}
        alt=""
        className="h-11 w-11 rounded-md flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {href ? (
            <Link href={href} className="text-sm font-semibold truncate hover:underline">
              {p.name || t("common.player")}
            </Link>
          ) : (
            <span className="text-sm font-semibold truncate">{p.name || "Joueur"}</span>
          )}
          {p.onFire && <Flame className="h-4 w-4 text-orange-400 flex-shrink-0" />}
        </div>
        {/* Rank icon glued to its label */}
        <div className="flex items-center gap-1.5">
          {p.tier && (
            // biome-ignore lint/performance/noImgElement: external CDN icon
            <img
              src={getRankIconUrl(capitalizeTier(p.tier) as TierName)}
              alt=""
              className="h-5 w-5 flex-shrink-0"
            />
          )}
          <p className="text-xs text-muted-foreground truncate">{rank}</p>
        </div>
        {p.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {p.tags.map((tag) => {
              const meta = TAG_META[tag]
              return (
                <span
                  key={tag}
                  className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                >
                  {meta.emoji} {t(meta.label)}
                </span>
              )
            })}
          </div>
        )}
      </div>
      <div className="w-16 flex-shrink-0 text-right">
        <p className="text-sm">
          <span className="text-green-500 font-medium">
            {p.recentWins}
            {t("perf.winShort")}
          </span>{" "}
          <span className="text-red-500 font-medium">
            {p.recentLosses}
            {t("perf.lossShort")}
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground">
          {p.streak !== 0 ? t("live.streak", { n: Math.abs(p.streak) }) : "—"}
        </p>
      </div>
    </div>
  )
}

export function LiveGame({ puuid, region, initialData }: LiveGameProps) {
  const { t } = useI18n()
  const { data, isLoading } = useLiveGame(puuid, region, initialData)

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
      <div className="flex items-center gap-2 px-5 py-3 border-b border-green-500/30">
        <Radio className="h-5 w-5 text-green-500 animate-pulse" />
        <span className="text-base font-semibold text-green-500">{t("live.inGame")}</span>
        <span className="text-sm text-muted-foreground">{t("live.since", { min: minutes })}</span>
      </div>
      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-blue-400 mb-1.5">{t("live.blueTeam")}</p>
          {blue.map((p) => (
            <PlayerRow key={`${p.puuid}-${p.championId}`} p={p} region={region} t={t} />
          ))}
        </div>
        <div>
          <p className="text-sm font-semibold text-red-400 mb-1.5">{t("live.redTeam")}</p>
          {red.map((p) => (
            <PlayerRow key={`${p.puuid}-${p.championId}`} p={p} region={region} t={t} />
          ))}
        </div>
      </div>
    </div>
  )
}
