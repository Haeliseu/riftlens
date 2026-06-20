"use client"

import { getChampionIconUrl, type MatchSummary, queueName } from "@riftlens/riot-api"
import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useMatchHistory } from "@/hooks/useMatchHistory"
import { MatchDetailPanel } from "./MatchDetailPanel"

const SESSION_GAP_MS = 3 * 3_600_000 // a session breaks after a >3h gap

const ROLES = [
  { id: "ALL", label: "Tous" },
  { id: "TOP", label: "Top" },
  { id: "JUNGLE", label: "Jng" },
  { id: "MIDDLE", label: "Mid" },
  { id: "BOTTOM", label: "ADC" },
  { id: "UTILITY", label: "Supp" },
]

const QUEUE_GROUPS = [
  { id: "ALL", label: "Toutes" },
  { id: "SOLO", label: "Solo/Duo" },
  { id: "FLEX", label: "Flex" },
  { id: "OTHER", label: "Autre" },
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
  gameName: string
  tagLine: string
  puuid?: string | null
  opponentPuuid?: string
  opponentRelation?: "ally" | "enemy" | "both"
  period?: "all" | "day" | "session"
}

function kda(k: number, d: number, a: number): string {
  const ratio = d === 0 ? k + a : (k + a) / d
  return `${ratio.toFixed(2)} KDA`
}

function duration(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return "à l'instant"
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return `il y a ${d} j`
}

export function MatchHistory({
  region,
  gameName,
  tagLine,
  puuid,
  opponentPuuid,
  period = "all",
}: MatchHistoryProps) {
  const router = useRouter()
  const [count, setCount] = useState(10)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [role, setRole] = useState<string>("ALL")
  const [queueGroup, setQueueGroup] = useState<string>("ALL")
  const { data: rawMatches, isLoading, isError, isFetching } = useMatchHistory(puuid, region, count)

  let matches = rawMatches ? filterByPeriod(rawMatches, period) : rawMatches
  if (matches && queueGroup !== "ALL")
    matches = matches.filter((m) => inQueueGroup(m.queueId, queueGroup))
  if (matches && role !== "ALL") matches = matches.filter((m) => m.position === role)
  const canLoadMore =
    (rawMatches?.length ?? 0) >= count && count < 50 && period === "all" && queueGroup === "ALL"

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {QUEUE_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setQueueGroup(g.id)}
              className={`rounded-md px-2.5 py-1 text-xs ${
                queueGroup === g.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex gap-1">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`rounded-md px-2.5 py-1 text-xs ${
                role === r.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {opponentPuuid && (
        <div className="flex items-center gap-2 rounded-md border bg-accent/50 px-3 py-2 text-sm">
          <span>Filtre : parties avec/contre ce joueur</span>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/profile/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
              )
            }
            className="ml-auto text-xs underline"
          >
            Effacer
          </button>
        </div>
      )}

      {!puuid ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Joueur introuvable sur cette région.
        </p>
      ) : isLoading ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Chargement de l'historique…
        </p>
      ) : isError ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Historique indisponible (clé API Riot ?).
        </p>
      ) : !matches || matches.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">Aucune partie récente.</p>
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
                  {/* biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed */}
                  <img
                    src={getChampionIconUrl(m.championId)}
                    alt={m.championName}
                    className="h-9 w-9 rounded-md flex-shrink-0"
                  />
                  <div className="w-[88px] flex-shrink-0">
                    <p
                      className={`text-xs font-semibold ${m.win ? "text-green-500" : "text-red-500"}`}
                    >
                      {m.win ? "Victoire" : "Défaite"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {queueName(m.queueId)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {duration(m.gameDurationS)} · {relativeTime(m.gameCreationMs)}
                    </p>
                  </div>
                  <div className="w-[76px] flex-shrink-0">
                    <p className="text-sm font-medium font-mono">
                      {m.kills}
                      <span className="text-muted-foreground font-normal"> / {m.deaths} / </span>
                      {m.assists}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {kda(m.kills, m.deaths, m.assists)}
                    </p>
                  </div>
                  <div className="w-[64px] flex-shrink-0">
                    <p className="text-xs">{m.cs} CS</p>
                    <p className="text-[11px] text-muted-foreground">{csPerMin} CS/min</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{kp}%</p>
                    <p className="text-[11px] text-muted-foreground">KP</p>
                  </div>
                  <div className="ml-auto text-center w-10 flex-shrink-0">
                    <p className={`text-base font-bold leading-none ${carryColor(m.carryScore)}`}>
                      {m.carryScore}
                    </p>
                    <p className="text-[10px] text-muted-foreground">carry</p>
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
              onClick={() => setCount((c) => Math.min(50, c + 10))}
              disabled={isFetching}
              className="w-full rounded-md border bg-card py-2 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
            >
              {isFetching ? "Chargement…" : "Voir plus de parties"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
