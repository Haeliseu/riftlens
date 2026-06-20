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
              router.push(`/profile/${region}/${encodeURIComponent(gameName)}/${tagLine}`)
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
        <div className="space-y-1.5">
          {matches.map((m) => (
            <div
              key={m.matchId}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                m.win
                  ? "border-l-4 border-l-blue-500 bg-blue-500/5"
                  : "border-l-4 border-l-red-500 bg-red-500/5"
              }`}
            >
              {/* biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed */}
              <img
                src={getChampionIconUrl(m.championId)}
                alt={m.championName}
                className="h-10 w-10 rounded-md flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{m.championName}</p>
                <p className="text-xs text-muted-foreground">{queueName(m.queueId)}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-medium">
                  {m.kills} / <span className="text-red-500">{m.deaths}</span> / {m.assists}
                </p>
                <p className="text-xs text-muted-foreground">
                  {kda(m.kills, m.deaths, m.assists)} · {m.cs} CS
                </p>
              </div>
              <div className="text-right w-20 flex-shrink-0">
                <p className={`text-sm font-semibold ${m.win ? "text-blue-500" : "text-red-500"}`}>
                  {m.win ? "Victoire" : "Défaite"}
                </p>
                <p className="text-xs text-muted-foreground">{relativeTime(m.gameCreationMs)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
