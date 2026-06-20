"use client"

import { getChampionIconUrl } from "@riftlens/riot-api"
import Link from "next/link"
import { type MatchDetailParticipant, useMatchDetail } from "@/hooks/useMatchDetail"

interface MatchDetailPanelProps {
  matchId: string
  region: string
}

function Row({ p, region }: { p: MatchDetailParticipant; region: string }) {
  const href = `/profile/${region}/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`
  return (
    <div className="flex items-center gap-2 py-1">
      {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
      <img
        src={getChampionIconUrl(p.championId)}
        alt={p.championName}
        className="h-6 w-6 rounded flex-shrink-0"
      />
      <Link href={href} className="text-xs truncate hover:underline min-w-0 flex-1">
        {p.gameName || p.championName}
      </Link>
      <span className="text-[11px] font-mono text-muted-foreground w-16 text-right">
        {p.kills}/{p.deaths}/{p.assists}
      </span>
      <span className="text-[11px] text-muted-foreground w-12 text-right">{p.cs} CS</span>
    </div>
  )
}

export function MatchDetailPanel({ matchId, region }: MatchDetailPanelProps) {
  const { data, isLoading, isError } = useMatchDetail(matchId, region)

  if (isLoading) {
    return <div className="px-3 py-3 text-xs text-muted-foreground">Chargement du détail…</div>
  }
  if (isError || !data) {
    return <div className="px-3 py-3 text-xs text-muted-foreground">Détail indisponible.</div>
  }

  const blue = data.participants.filter((p) => p.teamId === 100)
  const red = data.participants.filter((p) => p.teamId === 200)
  const blueWin = blue[0]?.win ?? false

  return (
    <div className="grid grid-cols-1 gap-3 px-3 py-3 sm:grid-cols-2">
      <div>
        <p className={`text-xs font-semibold mb-1 ${blueWin ? "text-green-500" : "text-red-500"}`}>
          Équipe bleue {blueWin ? "· Victoire" : "· Défaite"}
        </p>
        {blue.map((p) => (
          <Row key={p.puuid} p={p} region={region} />
        ))}
      </div>
      <div>
        <p className={`text-xs font-semibold mb-1 ${blueWin ? "text-red-500" : "text-green-500"}`}>
          Équipe rouge {blueWin ? "· Défaite" : "· Victoire"}
        </p>
        {red.map((p) => (
          <Row key={p.puuid} p={p} region={region} />
        ))}
      </div>
    </div>
  )
}
