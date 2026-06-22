"use client"

import {
  getChampionIconUrl,
  getRankIconUrl,
  type MatchSummary,
  type TierName,
} from "@riftlens/riot-api"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { useChampions } from "@/hooks/useChampions"
import { useLpPerGame } from "@/hooks/useLpPerGame"
import { useMatchHistory } from "@/hooks/useMatchHistory"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { queueKey } from "@/lib/queues"
import { ROLES, roleIconUrl } from "@/lib/roles"
import { capitalizeTier, rankLabel } from "@/lib/tiers"
import { ChampionFilterModal } from "./ChampionFilterModal"
import { MatchDetailPanel } from "./MatchDetailPanel"
import { MatchupVs } from "./MatchupVs"
import { PerformanceSummary } from "./PerformanceSummary"

const SESSION_GAP_MS = 3 * 3_600_000 // a session breaks after a >3h gap

const PERIODS: { id: "all" | "day" | "session"; label: TranslationKey }[] = [
  { id: "day", label: "filter.period.day" },
  { id: "session", label: "filter.period.session" },
  { id: "all", label: "filter.period.all" },
]

const QUEUE_GROUPS: { id: string; label: TranslationKey }[] = [
  { id: "ALL", label: "filter.queue.all" },
  { id: "SOLO", label: "filter.queue.solo" },
  { id: "FLEX", label: "filter.queue.flex" },
  { id: "OTHER", label: "filter.queue.other" },
]

// SOLO/FLEX filter server-side (Riot queue param) → an exact page of that queue.
const SERVER_QUEUE: Record<string, number | undefined> = { SOLO: 420, FLEX: 440 }

function inQueueGroup(queueId: number | null, group: string): boolean {
  if (group === "ALL") return true
  if (group === "SOLO") return queueId === 420
  if (group === "FLEX") return queueId === 440
  return queueId !== 420 && queueId !== 440 // OTHER (ARAM, Arena, normals…)
}

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

function filterByPeriod<M extends MatchSummary>(
  matches: M[],
  period: "all" | "day" | "session"
): M[] {
  if (period === "day") {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return matches.filter((m) => m.gameCreationMs >= start.getTime())
  }
  if (period === "session") {
    const sorted = [...matches].sort((a, b) => b.gameCreationMs - a.gameCreationMs)
    const out: M[] = []
    for (let i = 0; i < sorted.length; i++) {
      const m = sorted[i]
      if (!m) break
      const prev = sorted[i - 1]
      if (i === 0 || (prev && prev.gameCreationMs - m.gameCreationMs <= SESSION_GAP_MS)) out.push(m)
      else break
    }
    return out
  }
  return matches
}

interface MatchHistoryProps {
  region: string
  puuid?: string | null
}

function duration(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

type T = ReturnType<typeof useI18n>["t"]

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
  rankChange: { dir: "promotion" | "demotion"; tier: string; division: string } | undefined
  t: T
}) {
  if (value === undefined) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  const positive = value >= 0
  const color = positive ? "text-green-500" : "text-red-500"
  return (
    <span className={`flex flex-col items-center leading-tight ${color}`}>
      {rankChange && (
        // biome-ignore lint/performance/noImgElement: external CDN icon
        <img
          src={getRankIconUrl(capitalizeTier(rankChange.tier) as TierName)}
          alt={rankLabel(t, rankChange.tier, rankChange.division)}
          title={t(rankChange.dir === "promotion" ? "history.promotion" : "history.demotion", {
            rank: rankLabel(t, rankChange.tier, rankChange.division),
          })}
          className="h-6 w-6"
        />
      )}
      <span className="text-base font-bold tabular-nums">
        {value > 0 ? "+" : ""}
        {value}
      </span>
    </span>
  )
}

export function MatchHistory({ region, puuid }: MatchHistoryProps) {
  const { t } = useI18n()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [role, setRole] = useState<string>("ALL")
  const [queueGroup, setQueueGroup] = useState<string>("ALL")
  const [period, setPeriod] = useState<"all" | "day" | "session">("all")
  const [withChamp, setWithChamp] = useState<number | null>(null)
  const [againstChamp, setAgainstChamp] = useState<number | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const { data: champions } = useChampions()
  const { data: lpPerGame } = useLpPerGame(puuid)
  // Solo/Flex are filtered server-side (Riot queue param) so each page is exactly
  // 20 of that queue. Other filters (role, champion, OTHER, period) are applied
  // client-side across loaded pages — "load more" fetches the next page.
  const serverQueue = SERVER_QUEUE[queueGroup]
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMatchHistory(puuid, region, serverQueue)
  const rawMatches = data?.pages.flat()

  let matches = rawMatches ? filterByPeriod(rawMatches, period) : rawMatches
  // Client-side queue filter only needed for OTHER (no single Riot queue id).
  if (matches && queueGroup === "OTHER")
    matches = matches.filter((m) => inQueueGroup(m.queueId, queueGroup))
  if (matches && role !== "ALL") matches = matches.filter((m) => m.position === role)
  // "with" now means the champion the player themselves played.
  if (matches && withChamp != null) matches = matches.filter((m) => m.championId === withChamp)
  if (matches && againstChamp != null)
    matches = matches.filter((m) => m.enemyChampionIds.includes(againstChamp))
  const canLoadMore = hasNextPage

  return (
    <div className="space-y-2">
      {matches && matches.length > 0 && <PerformanceSummary matches={matches} />}

      <div className="flex flex-wrap items-center gap-3">
        {/* Role square icons — outline only on selected, toggle to clear */}
        <div className="flex gap-1">
          {ROLES.map((r) => {
            const active = role === r.id
            return (
              <button
                key={r.id}
                type="button"
                title={t(r.label)}
                onClick={() => setRole(active ? "ALL" : r.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-md ${
                  active ? "ring-2 ring-primary bg-accent" : "opacity-50 hover:opacity-100"
                }`}
              >
                {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                <img src={roleIconUrl(r.id)} alt={t(r.label)} className="h-4 w-4" />
              </button>
            )
          })}
        </div>

        {/* Period — single container, outline only on selected */}
        <div className="flex gap-0.5 rounded-md border p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded px-2.5 py-1 text-xs ${
                period === p.id
                  ? "ring-1 ring-primary bg-accent font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {t(p.label)}
            </button>
          ))}
        </div>

        {/* Queue group */}
        <div className="flex gap-0.5 rounded-md border p-0.5">
          {QUEUE_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setQueueGroup(g.id)}
              className={`rounded px-2.5 py-1 text-xs ${
                queueGroup === g.id
                  ? "ring-1 ring-primary bg-accent font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {t(g.label)}
            </button>
          ))}
        </div>

        {/* Champion filter — opens a modal to pick a 'with' and an 'against' champ */}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${
            withChamp != null || againstChamp != null
              ? "ring-1 ring-primary bg-accent font-medium"
              : "text-muted-foreground"
          }`}
        >
          {withChamp != null && (
            // biome-ignore lint/performance/noImgElement: external CDN icon
            <img src={getChampionIconUrl(withChamp)} alt="" className="h-4 w-4 rounded" />
          )}
          {againstChamp != null && (
            <>
              <span>{t("history.vs").toLowerCase()}</span>
              {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
              <img src={getChampionIconUrl(againstChamp)} alt="" className="h-4 w-4 rounded" />
            </>
          )}
          {withChamp == null && againstChamp == null && t("filter.champion")}
        </button>
      </div>

      {filterOpen && (
        <ChampionFilterModal
          champions={champions ?? []}
          withChamp={withChamp}
          againstChamp={againstChamp}
          onWith={setWithChamp}
          onAgainst={setAgainstChamp}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {!puuid ? (
        <p className="text-muted-foreground text-sm text-center py-8">{t("history.notFound")}</p>
      ) : isLoading ? (
        <p className="text-muted-foreground text-sm text-center py-8">{t("history.loading")}</p>
      ) : isError ? (
        <p className="text-muted-foreground text-sm text-center py-8">{t("history.error")}</p>
      ) : !matches || matches.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">{t("history.empty")}</p>
      ) : (
        <div className="space-y-1">
          {matches.map((m) => {
            const csPerMin = m.gameDurationS > 0 ? (m.cs / (m.gameDurationS / 60)).toFixed(1) : "0"
            const kp = m.teamKills > 0 ? Math.round(((m.kills + m.assists) / m.teamKills) * 100) : 0
            const cells = itemCells(m.items, m.itemIcons)
            const expanded = expandedId === m.matchId
            return (
              <div
                key={m.matchId}
                className={`rounded-r-md border border-l-[3px] ${
                  m.win ? "border-l-green-500 bg-green-500/5" : "border-l-red-500 bg-red-500/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : m.matchId)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left"
                >
                  {/* 0. LP gain/loss — its own column, left of the info lines */}
                  <div className="w-12 flex-shrink-0 flex items-center justify-center">
                    <LpDelta
                      value={lpPerGame?.matchLp[m.matchId]}
                      rankChange={lpPerGame?.matchRankChange[m.matchId]}
                      t={t}
                    />
                  </div>

                  {/* 1. Result info: queue, date, win/loss, duration */}
                  <div className="w-[96px] flex-shrink-0 space-y-0.5">
                    {m.queueId === 420 ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {t(queueKey(m.queueId, m.gameMode))}
                      </p>
                    ) : (
                      <span className="inline-block rounded bg-accent px-1.5 py-px text-[11px] font-medium text-foreground/80">
                        {t(queueKey(m.queueId, m.gameMode))}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {relativeTime(t, m.gameCreationMs)}
                    </p>
                    <p
                      className={`text-sm font-semibold ${m.win ? "text-green-500" : "text-red-500"}`}
                    >
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
                      {[m.keystoneIcon, m.secondaryIcon].map((url, i) =>
                        url ? (
                          // biome-ignore lint/performance/noImgElement: external CDN icon
                          // biome-ignore lint/suspicious/noArrayIndexKey: fixed rune slots
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className={`h-[18px] w-[18px] rounded-full ${i === 1 ? "bg-muted/40 p-0.5" : ""}`}
                          />
                        ) : (
                          // biome-ignore lint/suspicious/noArrayIndexKey: fixed rune slots
                          <span key={i} className="h-[18px] w-[18px] rounded-full bg-muted/40" />
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
          })}

          {canLoadMore && (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full rounded-md border bg-card py-2 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
            >
              {isFetchingNextPage ? t("common.loading") : t("history.loadMore")}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
