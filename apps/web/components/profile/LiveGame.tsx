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

/** Image that sits over a pulsing placeholder, so you see it stream in from the
 *  CDN — the placeholder shows through until the (opaque) art has loaded. */
function CdnImg({ src, className }: { src: string; className: string }) {
  return (
    <span className="absolute inset-0 animate-pulse rounded-[inherit] bg-white/10">
      {/* biome-ignore lint/performance/noImgElement: external CDN art */}
      <img src={src} alt="" loading="lazy" className={className} />
    </span>
  )
}

/** A League loading-screen style card. While the game is only *detected* (not
 *  yet enriched), rank/form render as skeletons so you watch them fill in. */
function PlayerCard({
  p,
  region,
  enriched,
  t,
}: {
  p: LiveParticipant
  region: string
  enriched: boolean
  t: T
}) {
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
      <CdnImg
        src={getChampionPortraitUrl(p.championId)}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

      {p.onFire && <Flame className="absolute right-2 top-2 h-5 w-5 text-orange-400 drop-shadow" />}

      {/* Summoner spells + keystone rune (top-left, like champ select) */}
      <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
        {p.spellIcons.map((url, i) =>
          url ? (
            // biome-ignore lint/performance/noImgElement: external CDN icon
            <img
              key={`sp-${i}-${url}`}
              src={url}
              alt=""
              className="h-5 w-5 rounded border border-black/40"
              loading="lazy"
            />
          ) : null
        )}
        {p.keystoneIcon && (
          // biome-ignore lint/performance/noImgElement: external CDN icon
          <img
            src={p.keystoneIcon}
            alt=""
            className="h-5 w-5 rounded-full bg-black/40"
            loading="lazy"
          />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-1.5 pb-2 text-center">
        {/* Winged rank emblem framing the champion avatar */}
        <div className="relative mb-1 flex h-16 w-32 items-center justify-center">
          {tierKey && (
            <>
              {/* biome-ignore lint/performance/noImgElement: external CDN art */}
              <img
                src={getRankEmblemUrl(tierKey)}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_0_5px_rgba(0,0,0,0.9)]"
              />
            </>
          )}
          {/* biome-ignore lint/performance/noImgElement: external CDN art */}
          <img
            src={getChampionIconUrl(p.championId)}
            alt=""
            className="relative h-9 w-9 rounded-full ring-2 ring-white/80"
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

        {enriched ? (
          <>
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
          </>
        ) : (
          // Loading the rank/form for this player.
          <>
            <span className="mt-0.5 h-2.5 w-16 animate-pulse rounded bg-white/25" />
            <span className="mt-1 h-2 w-10 animate-pulse rounded bg-white/15" />
          </>
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
  enriched,
  t,
}: {
  title: string
  color: string
  players: LiveParticipant[]
  region: string
  enriched: boolean
  t: T
}) {
  return (
    <div>
      <p className={`mb-2 text-sm font-semibold ${color}`}>{title}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {players.map((p) => (
          <PlayerCard
            key={`${p.puuid}-${p.championId}`}
            p={p}
            region={region}
            enriched={enriched}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-green-500/40 bg-green-500/5">{children}</div>
}

function Header({ minutes, t }: { minutes: number | null; t: T }) {
  return (
    <div className="flex items-center gap-2 border-b border-green-500/30 px-5 py-3">
      <Radio className="h-5 w-5 animate-pulse text-green-500" />
      <span className="text-base font-semibold text-green-500">{t("live.inGame")}</span>
      {minutes != null ? (
        <span className="text-sm text-muted-foreground">{t("live.since", { min: minutes })}</span>
      ) : (
        <span className="text-sm text-muted-foreground">{t("live.loading")}</span>
      )}
    </div>
  )
}

interface LiveGameProps {
  puuid?: string | null
  region: string
  /** Un-enriched game from server-side detection — renders the cards instantly. */
  initialBasic?: LiveGameData | null
}

export function LiveGame({ puuid, region, initialBasic }: LiveGameProps) {
  const { t } = useI18n()
  const { data, isLoading } = useLiveGame(puuid, region)

  // Enriched client data wins; otherwise fall back to the detected (basic) game.
  const view = data ?? initialBasic ?? null
  const enriched = !!data

  if (!view) {
    if (isLoading) {
      return (
        <Panel>
          <Header minutes={null} t={t} />
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t("live.loading")}
          </div>
        </Panel>
      )
    }
    return (
      <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        {t("live.notInGame")}
      </div>
    )
  }

  const blue = view.participants.filter((p) => p.teamId === 100)
  const red = view.participants.filter((p) => p.teamId === 200)
  const minutes = Math.floor(view.gameLengthS / 60)

  return (
    <Panel>
      <Header minutes={minutes} t={t} />
      <div className="space-y-5 p-5">
        <Team
          title={t("live.blueTeam")}
          color="text-blue-400"
          players={blue}
          region={region}
          enriched={enriched}
          t={t}
        />
        <Team
          title={t("live.redTeam")}
          color="text-red-400"
          players={red}
          region={region}
          enriched={enriched}
          t={t}
        />
      </div>
    </Panel>
  )
}
