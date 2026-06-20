"use client"

import { getChampionIconUrl, getRankIconUrl, type TierName } from "@riftlens/riot-api"
import { Flame, Radio } from "lucide-react"
import Link from "next/link"
import { type LiveParticipant, useLiveGame } from "@/hooks/useLiveGame"
import { capitalizeTier, rankLabelFr, tierColor } from "@/lib/tiers"

interface LiveGameProps {
  puuid?: string | null
  region: string
}

function PlayerRow({ p, region }: { p: LiveParticipant; region: string }) {
  const href = p.name.includes("#")
    ? `/profile/${region}/${encodeURIComponent(p.name.split("#")[0] ?? "")}/${encodeURIComponent(
        p.name.split("#")[1] ?? ""
      )}`
    : null
  const rank =
    p.tier && p.division ? `${rankLabelFr(p.tier, p.division)} · ${p.lp ?? 0} LP` : "Non classé"
  return (
    <div className="flex items-center gap-2 py-1.5">
      {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
      <img
        src={getChampionIconUrl(p.championId)}
        alt=""
        className="h-8 w-8 rounded-md flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          {href ? (
            <Link href={href} className="text-xs font-medium truncate hover:underline">
              {p.name || "Joueur"}
            </Link>
          ) : (
            <span className="text-xs font-medium truncate">{p.name || "Joueur"}</span>
          )}
          {p.onFire && <Flame className="h-3 w-3 text-orange-400 flex-shrink-0" />}
        </div>
        <p className="text-[10px] text-muted-foreground">{rank}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {p.tier && (
          // biome-ignore lint/performance/noImgElement: external CDN icon
          <img
            src={getRankIconUrl(capitalizeTier(p.tier) as TierName)}
            alt=""
            className="h-5 w-5"
          />
        )}
        <div className="w-12 text-right">
          <p className="text-[11px]">
            <span className="text-green-500">{p.recentWins}V</span>{" "}
            <span className="text-red-500">{p.recentLosses}D</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {p.streak !== 0 ? `série ${Math.abs(p.streak)}` : "—"}
          </p>
        </div>
      </div>
    </div>
  )
}

export function LiveGame({ puuid, region }: LiveGameProps) {
  const { data, isLoading } = useLiveGame(puuid, region)

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Recherche d'une partie en cours…
      </div>
    )
  }
  if (!data) {
    return (
      <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Le joueur n'est pas en partie actuellement.
      </div>
    )
  }

  const blue = data.participants.filter((p) => p.teamId === 100)
  const red = data.participants.filter((p) => p.teamId === 200)
  const minutes = Math.floor(data.gameLengthS / 60)

  return (
    <div className="rounded-xl border border-green-500/40 bg-green-500/5">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-green-500/30">
        <Radio className="h-4 w-4 text-green-500 animate-pulse" />
        <span className="text-sm font-semibold text-green-500">En partie</span>
        <span className="text-xs text-muted-foreground">· depuis {minutes} min</span>
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-blue-400 mb-1">Équipe bleue</p>
          {blue.map((p) => (
            <PlayerRow key={`${p.puuid}-${p.championId}`} p={p} region={region} />
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-red-400 mb-1">Équipe rouge</p>
          {red.map((p) => (
            <PlayerRow key={`${p.puuid}-${p.championId}`} p={p} region={region} />
          ))}
        </div>
      </div>
    </div>
  )
}
