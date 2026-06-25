"use client"

import { getChampionIconUrl, getRankIconUrl, type TierName } from "@riftlens/riot-api"
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react"
import type { EnrichedMatch } from "@/hooks/useMatchHistory"
import type { useI18n } from "@/lib/i18n"
import { queueKey } from "@/lib/queues"
import { capitalizeTier, rankLabel } from "@/lib/tiers"
import { MatchDetailPanel } from "./MatchDetailPanel"
import { MatchupVs } from "./MatchupVs"

type T = ReturnType<typeof useI18n>["t"]

export type RankChange = { dir: "promotion" | "demotion"; tier: string; division: string }

function carryColor(score: number): string {
  if (score >= 65) return "text-violet-400"
  if (score >= 45) return "text-blue-400"
  if (score >= 30) return "text-muted-foreground"
  return "text-red-400"
}

// Role-quest item ids (CommunityDragon): they sit in a normal slot but we pull
// them out into the dedicated last cell of the item grid.
const QUEST_ITEM_IDS = new Set([
  1090, 1091, 1092, 1093, 1094, 1200, 1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208, 1209, 1210,
  1211, 1220, 1221, 1222,
])

/**
 * Lay out the 8 item cells: row 1 = items 1-3 + trinket, row 2 = items 4-6 +
 * the role-quest item (pulled out of its normal slot into the last cell).
 */
function itemCells(items: number[], icons: (string | null)[]): (string | null)[] {
  const trinket = icons[6] ?? null
  let quest: string | null = null
  const regular: (string | null)[] = []
  for (let i = 0; i < 6; i++) {
    const id = items[i] ?? 0
    const icon = icons[i] ?? null
    if (id && QUEST_ITEM_IDS.has(id)) quest = icon
    else regular.push(icon)
  }
  return [
    regular[0] ?? null,
    regular[1] ?? null,
    regular[2] ?? null,
    trinket,
    regular[3] ?? null,
    regular[4] ?? null,
    regular[5] ?? null,
    quest,
  ]
}

function duration(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

function kdaLabel(t: T, k: number, d: number, a: number): string {
  const ratio = d === 0 ? k + a : (k + a) / d
  return t("history.kda", { ratio: ratio.toFixed(2) })
}

function relativeTime(t: T, ms: number): string {
  const diff = Date.now() - ms
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return t("time.now")
  if (h < 24) return t("time.hoursAgo", { h })
  return t("time.daysAgo", { d: Math.floor(h / 24) })
}

function placementLabel(t: T, p: number): string {
  return p === 1 ? t("history.placement.first") : t("history.placement.nth", { n: p })
}

/**
 * Per-game LP: the signed gain/loss in a bigger font. When the game crossed a
 * tier/division boundary we also show the icon of the rank reached (promotion
 * or demotion) instead of a plain arrow.
 */
function LpDelta({
  value,
  rankChange,
  t,
}: {
  value: number | undefined
  rankChange: RankChange | undefined
  t: T
}) {
  if (value === undefined) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  const positive = value >= 0
  const color = positive ? "text-green-500" : "text-red-500"
  const promo = rankChange?.dir === "promotion"
  const rankIcon = rankChange && (
    <span
      className="flex flex-col items-center leading-none"
      title={t(promo ? "history.promotion" : "history.demotion", {
        rank: rankLabel(t, rankChange.tier, rankChange.division),
      })}
    >
      {/* Promotion: green up arrow above the rank icon. */}
      {promo && <ArrowUp className="h-3.5 w-3.5 text-green-500" />}
      {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
      <img
        src={getRankIconUrl(capitalizeTier(rankChange.tier) as TierName)}
        alt={rankLabel(t, rankChange.tier, rankChange.division)}
        className="h-6 w-6"
      />
      {/* Demotion: red down arrow below the rank icon. */}
      {!promo && <ArrowDown className="h-3.5 w-3.5 text-red-500" />}
    </span>
  )
  return (
    <span className={`flex flex-col items-center leading-tight ${color}`}>
      {rankIcon}
      <span className="text-base font-bold tabular-nums">
        {value > 0 ? "+" : ""}
        {value}
      </span>
    </span>
  )
}

interface MatchRowProps {
  m: EnrichedMatch
  region: string
  // The history list only renders for a signed-in player, so puuid is always set.
  puuid: string
  lpValue: number | undefined
  rankChange: RankChange | undefined
  expanded: boolean
  onToggle: () => void
  /** queueId → name fallback (CommunityDragon) for ids our table doesn't cover. */
  queues: Record<number, string> | undefined
  t: T
}

export function MatchRow({
  m,
  region,
  puuid,
  lpValue,
  rankChange,
  expanded,
  onToggle,
  queues,
  t,
}: MatchRowProps) {
  const qk = queueKey(m.queueId, m.gameMode)
  const queueLabel =
    qk !== "queue.other" ? t(qk) : ((m.queueId != null ? queues?.[m.queueId] : undefined) ?? t(qk))
  const csPerMin = m.gameDurationS > 0 ? (m.cs / (m.gameDurationS / 60)).toFixed(1) : "0"
  const kp = m.teamKills > 0 ? Math.round(((m.kills + m.assists) / m.teamKills) * 100) : 0
  const cells = itemCells(m.items, m.itemIcons)

  return (
    <div
      className={`rounded-r-md border border-l-[3px] ${
        m.win ? "border-l-green-500 bg-green-500/5" : "border-l-red-500 bg-red-500/5"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2 text-left"
      >
        {/* 0. LP gain/loss — its own column, left of the info lines */}
        <div className="w-12 flex-shrink-0 flex items-center justify-center">
          <LpDelta value={lpValue} rankChange={rankChange} t={t} />
        </div>

        {/* 1. Result info: queue, date, win/loss, duration */}
        <div className="w-[96px] flex-shrink-0 space-y-0.5">
          {m.queueId === 420 ? (
            <p className="text-xs text-muted-foreground truncate">{queueLabel}</p>
          ) : (
            <span className="inline-block rounded bg-accent px-1.5 py-px text-[11px] font-medium text-foreground">
              {queueLabel}
            </span>
          )}
          <p className="text-xs text-muted-foreground">{relativeTime(t, m.gameCreationMs)}</p>
          <p className={`text-sm font-semibold ${m.win ? "text-green-500" : "text-red-500"}`}>
            {m.win ? t("common.win") : t("common.loss")}
          </p>
          <p className="text-xs text-muted-foreground">{duration(m.gameDurationS)}</p>
        </div>

        {/* 2. Played champion */}
        {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
        <img
          src={getChampionIconUrl(m.championId)}
          alt={m.championName}
          className="h-10 w-10 rounded-md flex-shrink-0"
        />

        {/* 3. KDA · CS · KP */}
        <div className="w-[66px] flex-shrink-0">
          <p className="text-sm font-medium font-mono whitespace-nowrap">
            {m.kills}
            <span className="text-muted-foreground font-normal">/</span>
            {m.deaths}
            <span className="text-muted-foreground font-normal">/</span>
            {m.assists}
          </p>
          <p className="text-xs text-muted-foreground">
            {kdaLabel(t, m.kills, m.deaths, m.assists)}
          </p>
        </div>
        <div className="w-[62px] flex-shrink-0">
          <p className="text-sm">{t("history.cs", { cs: m.cs })}</p>
          <p className="text-xs text-muted-foreground">
            {t("history.csPerMin", { value: csPerMin })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{kp}%</p>
          <p className="text-xs text-muted-foreground">{t("history.kp")}</p>
        </div>

        {/* 4a. Summoner spells + runes (primary/secondary), before items */}
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            {m.spellIcons.map((url, i) =>
              url ? (
                // biome-ignore lint/performance/noImgElement: external CDN icon
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed spell slots
                <img key={i} src={url} alt="" className="h-[18px] w-[18px] rounded" />
              ) : (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed spell slots
                <span key={i} className="h-[18px] w-[18px] rounded bg-muted/40" />
              )
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {[
              { slot: "keystone", url: m.keystoneIcon },
              { slot: "secondary", url: m.secondaryIcon },
            ].map(({ slot, url }) =>
              url ? (
                // biome-ignore lint/performance/noImgElement: external CDN icon
                <img
                  key={slot}
                  src={url}
                  alt=""
                  className={`h-[18px] w-[18px] rounded-full ${slot === "secondary" ? "bg-muted/40 p-0.5" : ""}`}
                />
              ) : (
                <span key={slot} className="h-[18px] w-[18px] rounded-full bg-muted/40" />
              )
            )}
          </div>
        </div>

        {/* 4b. End-game items, 2 rows of 4:
            row 1 = items 1-3 + trinket, row 2 = items 4-6 + quest slot */}
        <div className="grid grid-cols-4 grid-rows-2 gap-0.5 flex-shrink-0">
          {cells.map((url, i) => {
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed item slots
                key={i}
                className="h-[22px] w-[22px] rounded-sm bg-muted/40"
              >
                {url && (
                  // biome-ignore lint/performance/noImgElement: external CDN icon
                  <img src={url} alt="" className="h-[22px] w-[22px] rounded-sm" />
                )}
              </div>
            )
          })}
        </div>

        {/* 5. Matchup: player champ vs lane opponent, diagonal "VS" tile. */}
        <MatchupVs
          championId={m.championId}
          championName={m.championName}
          laneOpponentChampionId={m.laneOpponentChampionId}
          position={m.position}
        />

        {/* 6. Carry score (no label) + MVP / ACE / placement */}
        <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
          <p className={`text-base font-bold leading-none ${carryColor(m.carryScore)}`}>
            {m.carryScore}
          </p>
          {m.badge ? (
            <span
              className={`mt-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                m.badge === "MVP"
                  ? "bg-amber-400/20 text-amber-400"
                  : "bg-violet-400/20 text-violet-400"
              }`}
            >
              {m.badge}
            </span>
          ) : (
            <span className="mt-1 text-[11px] text-muted-foreground">
              {placementLabel(t, m.placement)}
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className="border-t">
          <MatchDetailPanel matchId={m.matchId} region={region} ownerPuuid={puuid} />
        </div>
      )}
    </div>
  )
}
