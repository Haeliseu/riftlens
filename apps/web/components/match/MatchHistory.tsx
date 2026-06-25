"use client"

import { getChampionIconUrl, type MatchSummary } from "@riftlens/riot-api"
import { useState } from "react"
import { useChampions } from "@/hooks/useChampions"
import { useLpPerGame } from "@/hooks/useLpPerGame"
import { useMatchHistory } from "@/hooks/useMatchHistory"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { ROLES, roleIconUrl } from "@/lib/roles"
import { ChampionFilterModal } from "./ChampionFilterModal"
import { MatchRow } from "./MatchRow"
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
          {matches.map((m) => (
            <MatchRow
              key={m.matchId}
              m={m}
              region={region}
              puuid={puuid}
              lpValue={lpPerGame?.matchLp[m.matchId]}
              rankChange={lpPerGame?.matchRankChange[m.matchId]}
              expanded={expandedId === m.matchId}
              onToggle={() => setExpandedId(expandedId === m.matchId ? null : m.matchId)}
              t={t}
            />
          ))}

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
