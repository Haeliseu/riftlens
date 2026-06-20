"use client"

import { getChampionIconUrl, queueName } from "@riftlens/riot-api"
import { useRouter } from "next/navigation"
import { useMatchHistory } from "@/hooks/useMatchHistory"

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
}: MatchHistoryProps) {
  const router = useRouter()
  const { data: matches, isLoading, isError } = useMatchHistory(puuid, region)

  return (
    <div className="space-y-2">
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
        <p className="text-muted-foreground text-sm text-center py-8">
          Aucune partie classée récente.
        </p>
      ) : (
        <div className="space-y-1">
          {matches.map((m) => {
            const csPerMin = m.gameDurationS > 0 ? (m.cs / (m.gameDurationS / 60)).toFixed(1) : "0"
            const kp = m.teamKills > 0 ? Math.round(((m.kills + m.assists) / m.teamKills) * 100) : 0
            return (
              <div
                key={m.matchId}
                className={`flex items-center gap-3 rounded-r-md border border-l-[3px] px-3 py-2 ${
                  m.win ? "border-l-green-500 bg-green-500/5" : "border-l-red-500 bg-red-500/5"
                }`}
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
                <div className="ml-auto text-right">
                  <p className="text-xs font-medium">{kp}%</p>
                  <p className="text-[11px] text-muted-foreground">KP</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground w-12 text-right truncate">
                  {m.championName}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
