"use client"

import {
  getChampionIconUrl,
  getChampionPortraitUrl,
  getRankEmblemUrl,
  type PlayerTag,
  type TierName,
} from "@riftlens/riot-api"
import { Flame, Radio } from "lucide-react"
import { Link } from "@/components/Link"
import { type LiveGameData, type LiveParticipant, useLiveGame } from "@/hooks/useLiveGame"
import { useI18n } from "@/lib/i18n"
import { capitalizeTier, rankLabel } from "@/lib/tiers"

const TAG_EMOJI: Record<PlayerTag, string> = {
  "on-fire": "🔥",
  "one-trick": "🎯",
  "carry-potential": "💪",
  "fed-last-game": "🏆",
}

type T = ReturnType<typeof useI18n>["t"]

/** A League loading-screen style card: champion portrait, the winged rank
 *  emblem framing a champion avatar, then the player name with the rank spelled
 *  out where the champion title sits on the real loading screen. */
function PlayerCard({ p, region, t }: { p: LiveParticipant; region: string; t: T }) {
  const displayName = p.name.split("#")[0] || t("common.player")
  const href = p.name.includes("#")
    ? `/profile/${region}/${encodeURIComponent(p.name.split("#")[0] ?? "")}/${encodeURIComponent(
        p.name.split("#")[1] ?? ""
      )}`
    : null
  const tierKey = p.tier ? (capitalizeTier(p.tier) as TierName) : null
  const rankText = p.tier && p.division ? rankLabel(t, p.tier, p.division) : t("profile.unranked")

  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-black">
      {/* Champion loading art */}
      {/* biome-ignore lint/performance/noImgElement: external CDN art */}
      <img
        src={getChampionPortraitUrl(p.championId)}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
      />
      {/* Darken the bottom so the name/rank read clearly */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

      {p.onFire && <Flame className="absolute right-2 top-2 h-5 w-5 text-orange-400 drop-shadow" />}

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-1.5 pb-2 text-center">
        {/* Winged rank emblem framing the champion avatar */}
        <div className="relative mb-1 flex h-12 w-24 items-center justify-center">
          {tierKey && (
            // biome-ignore lint/performance/noImgElement: external CDN art
            <img
              src={getRankEmblemUrl(tierKey)}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
            />
          )}
          {/* biome-ignore lint/performance/noImgElement: external CDN art */}
          <img
            src={getChampionIconUrl(p.championId)}
            alt=""
            className="relative h-8 w-8 rounded-full ring-2 ring-white/70"
          />
        </div>

        {href ? (
          <Link
            href={href}
            className="max-w-full truncate text-xs font-semibold text-white hover:underline"
          >
            {displayName}
          </Link>
        ) : (
          <span className="max-w-full truncate text-xs font-semibold text-white">
            {displayName}
          </span>
        )}

        {/* Rank in full words — replaces the champion title */}
        <span className="text-[11px] font-medium uppercase tracking-wide text-yellow-200/90">
          {rankText}
        </span>

        <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
          <span className="font-medium text-green-400">
            {p.recentWins}
            {t("perf.winShort")}
          </span>
          <span className="font-medium text-red-400">
            {p.recentLosses}
            {t("perf.lossShort")}
          </span>
          {p.streak !== 0 && (
            <span className="text-muted-foreground">
              {t("live.streak", { n: Math.abs(p.streak) })}
            </span>
          )}
        </div>

        {p.tags.length > 0 && (
          <div className="mt-0.5 text-xs leading-none">
            {p.tags.map((tag) => TAG_EMOJI[tag]).join(" ")}
          </div>
        )}
      </div>
    </div>
  )
}

function Team({
  title,
  color,
  players,
  region,
  t,
}: {
  title: string
  color: string
  players: LiveParticipant[]
  region: string
  t: T
}) {
  return (
    <div>
      <p className={`mb-2 text-sm font-semibold ${color}`}>{title}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {players.map((p) => (
          <PlayerCard key={`${p.puuid}-${p.championId}`} p={p} region={region} t={t} />
        ))}
      </div>
    </div>
  )
}

interface LiveGameProps {
  puuid?: string | null
  region: string
  initialData?: LiveGameData | null
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
      <div className="flex items-center gap-2 border-b border-green-500/30 px-5 py-3">
        <Radio className="h-5 w-5 animate-pulse text-green-500" />
        <span className="text-base font-semibold text-green-500">{t("live.inGame")}</span>
        <span className="text-sm text-muted-foreground">{t("live.since", { min: minutes })}</span>
      </div>
      <div className="space-y-5 p-5">
        <Team
          title={t("live.blueTeam")}
          color="text-blue-400"
          players={blue}
          region={region}
          t={t}
        />
        <Team title={t("live.redTeam")} color="text-red-400" players={red} region={region} t={t} />
      </div>
    </div>
  )
}
