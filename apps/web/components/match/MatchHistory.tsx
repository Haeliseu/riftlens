"use client"

import { getChampionIconUrl, getItemIconUrl, type MatchSummary } from "@riftlens/riot-api"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { useChampions } from "@/hooks/useChampions"
import { useLpPerGame } from "@/hooks/useLpPerGame"
import { useMatchHistory } from "@/hooks/useMatchHistory"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { queueKey } from "@/lib/queues"
import { ROLES, roleIconUrl } from "@/lib/roles"
import { ChampionFilterModal } from "./ChampionFilterModal"
import { MatchDetailPanel } from "./MatchDetailPanel"
import { PerformanceSummary } from "./PerformanceSummary"

const SESSION_GAP_MS = 3 * 3_600_000 // a session breaks after a >3h gap

const PERIODS: { id: "all" | "day" | "session"; label: TranslationKey }[] = [
  { id: "all", label: "filter.period.all" },
  { id: "day", label: "filter.period.day" },
  { id: "session", label: "filter.period.session" },
]

const QUEUE_GROUPS: { id: string; label: TranslationKey }[] = [
  { id: "ALL", label: "filter.queue.all" },
  { id: "SOLO", label: "filter.queue.solo" },
  { id: "FLEX", label: "filter.queue.flex" },
  { id: "OTHER", label: "filter.queue.other" },
]

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

function filterByPeriod(
  matches: MatchSummary[],
  period: "all" | "day" | "session"
): MatchSummary[] {
  if (period === "day") {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return matches.filter((m) => m.gameCreationMs >= start.getTime())
  }
  if (period === "session") {
    const sorted = [...matches].sort((a, b) => b.gameCreationMs - a.gameCreationMs)
    const out: MatchSummary[] = []
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

export function MatchHistory({ region, puuid }: MatchHistoryProps) {
  const { t } = useI18n()
  const [count, setCount] = useState(30)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [role, setRole] = useState<string>("ALL")
  const [queueGroup, setQueueGroup] = useState<string>("ALL")
  const [period, setPeriod] = useState<"all" | "day" | "session">("all")
  const [withChamp, setWithChamp] = useState<number | null>(null)
  const [againstChamp, setAgainstChamp] = useState<number | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const { data: champions } = useChampions()
  const { data: lpPerGame } = useLpPerGame(puuid)
  const { data: rawMatches, isLoading, isError, isFetching } = useMatchHistory(puuid, region, count)

  let matches = rawMatches ? filterByPeriod(rawMatches, period) : rawMatches
  if (matches && queueGroup !== "ALL")
    matches = matches.filter((m) => inQueueGroup(m.queueId, queueGroup))
  if (matches && role !== "ALL") matches = matches.filter((m) => m.position === role)
  if (matches && withChamp != null)
    matches = matches.filter((m) => m.allyChampionIds.includes(withChamp))
  if (matches && againstChamp != null)
    matches = matches.filter((m) => m.enemyChampionIds.includes(againstChamp))
  const canLoadMore =
    (rawMatches?.length ?? 0) >= count && count < 50 && period === "all" && queueGroup === "ALL"

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
                  {/* Matchup: played champion on top, "vs lane opponent" below it
                      (enemy carry shown as a small badge on the opponent). */}
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-11">
                    {/* biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed */}
                    <img
                      src={getChampionIconUrl(m.championId)}
                      alt={m.championName}
                      className="h-9 w-9 rounded-md"
                    />
                    {m.laneOpponentChampionId != null && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-bold text-muted-foreground">
                          {t("history.vs")}
                        </span>
                        <div className="relative">
                          {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                          <img
                            src={getChampionIconUrl(m.laneOpponentChampionId)}
                            alt="adversaire de lane"
                            title="Adversaire de lane"
                            className="h-5 w-5 rounded-sm opacity-90"
                          />
                          {m.enemyCarryChampionId != null &&
                            m.enemyCarryChampionId !== m.laneOpponentChampionId && (
                              // biome-ignore lint/performance/noImgElement: external CDN icon
                              <img
                                src={getChampionIconUrl(m.enemyCarryChampionId)}
                                alt="carry adverse"
                                title="Carry adverse"
                                className="absolute -top-1 -right-1 h-3 w-3 rounded-sm border border-background shadow ring-1 ring-amber-400/70"
                              />
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-[88px] flex-shrink-0">
                    <p
                      className={`text-xs font-semibold ${m.win ? "text-green-500" : "text-red-500"}`}
                    >
                      {m.win ? t("common.win") : t("common.loss")}
                    </p>
                    {m.queueId === 420 ? (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {t(queueKey(m.queueId))}
                      </p>
                    ) : (
                      <span className="inline-block rounded bg-accent px-1.5 py-px text-[10px] font-medium text-foreground/80">
                        {t(queueKey(m.queueId))}
                      </span>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {duration(m.gameDurationS)} · {relativeTime(t, m.gameCreationMs)}
                    </p>
                    {lpPerGame?.matchLp[m.matchId] !== undefined && (
                      <p
                        className={`text-[11px] font-semibold ${
                          (lpPerGame.matchLp[m.matchId] ?? 0) >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {t("history.lp", {
                          value: `${(lpPerGame.matchLp[m.matchId] ?? 0) > 0 ? "+" : ""}${lpPerGame.matchLp[m.matchId]}`,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="w-[84px] flex-shrink-0">
                    <p className="text-sm font-medium font-mono whitespace-nowrap">
                      {m.kills}
                      <span className="text-muted-foreground font-normal"> / {m.deaths} / </span>
                      {m.assists}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {kdaLabel(t, m.kills, m.deaths, m.assists)}
                    </p>
                  </div>
                  <div className="w-[64px] flex-shrink-0">
                    <p className="text-xs">{t("history.cs", { cs: m.cs })}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("history.csPerMin", { value: csPerMin })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{kp}%</p>
                    <p className="text-[11px] text-muted-foreground">{t("history.kp")}</p>
                  </div>
                  {/* Items equipped at the end of the game, filling the empty space */}
                  <div className="ml-auto flex gap-0.5 flex-shrink-0">
                    {m.items.map((id, i) => {
                      const url = getItemIconUrl(id)
                      return (
                        <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: fixed item slots
                          key={i}
                          className="h-5 w-5 rounded-sm bg-muted/40"
                        >
                          {url && (
                            // biome-ignore lint/performance/noImgElement: external CDN icon
                            <img src={url} alt="" className="h-5 w-5 rounded-sm" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-center w-10 flex-shrink-0">
                    <p className={`text-base font-bold leading-none ${carryColor(m.carryScore)}`}>
                      {m.carryScore}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t("history.carry")}</p>
                  </div>
                  <div className="w-12 flex-shrink-0 flex justify-center">
                    {m.badge ? (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          m.badge === "MVP"
                            ? "bg-amber-400/20 text-amber-400"
                            : "bg-violet-400/20 text-violet-400"
                        }`}
                      >
                        {m.badge}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
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
              onClick={() => setCount((c) => Math.min(50, c + 20))}
              disabled={isFetching}
              className="w-full rounded-md border bg-card py-2 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
            >
              {isFetching ? t("common.loading") : t("history.loadMore")}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
