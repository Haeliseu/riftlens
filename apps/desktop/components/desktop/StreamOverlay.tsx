"use client"

import { useState } from "react"
import { cn } from "@riftlens/ui"
import type { TierName } from "@riftlens/riot-api"
import { getRankIconUrl, CURRENT_SEASON_LABEL } from "@riftlens/riot-api"
import Image from "next/image"

interface OverlayPlayer {
  name: string
  tier: TierName
  division: string
  lp: number
  champWinRate: number
  accountWinRate: number
  accountGames: number
  teamId: 100 | 200
}

interface StreamOverlayData {
  streamer: {
    name: string
    tagLine: string
    tier: TierName
    division: string
    lp: number
    maxLp: number
    seasonWinRate: number
    seasonGames: number
    sessionWins: number
    sessionLosses: number
    sessionWinRate: number
  }
  match?: {
    allies: OverlayPlayer[]
    enemies: OverlayPlayer[]
    dragonTimer?: number
    baronTimer?: number
  }
}

const HEAT_BG: Record<string, string> = {
  hot: "bg-[var(--color-heat-hot)]",
  good: "bg-[var(--color-heat-good)]",
  neutral: "bg-[var(--color-heat-neutral)]",
  cold: "bg-[var(--color-heat-cold)]",
}

function heatKey(wr: number) {
  if (wr >= 60) return "hot"
  if (wr >= 53) return "good"
  if (wr >= 47) return "neutral"
  return "cold"
}

function PlayerLine({ player }: { player: OverlayPlayer }) {
  const key = heatKey(player.champWinRate)
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <div className={cn("w-[3px] h-4 rounded-full flex-shrink-0", HEAT_BG[key])} />
      <Image
        src={getRankIconUrl(player.tier)}
        alt={player.tier}
        width={14}
        height={14}
        className="flex-shrink-0"
      />
      <span className="text-[10px] truncate flex-1 font-medium">{player.name}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        {player.champWinRate}%
      </span>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        {player.accountWinRate}%
      </span>
    </div>
  )
}

// Mock data for development
const MOCK_DATA: StreamOverlayData = {
  streamer: {
    name: "RiftStreamer",
    tagLine: "EUW",
    tier: "Diamond",
    division: "III",
    lp: 80,
    maxLp: 100,
    seasonWinRate: 56,
    seasonGames: 312,
    sessionWins: 3,
    sessionLosses: 1,
    sessionWinRate: 75,
  },
}

export function StreamOverlay({ data = MOCK_DATA }: { data?: StreamOverlayData }) {
  const [matchExpanded, setMatchExpanded] = useState(true)
  const { streamer, match } = data

  const lpPercent = Math.min(100, (streamer.lp / streamer.maxLp) * 100)

  return (
    <div
      className="fixed bottom-4 left-4 w-[226px] rounded-xl border border-white/10 bg-black/85 backdrop-blur-md text-white text-xs select-none"
      style={{ fontFamily: "monospace" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
          <span className="text-[8px] font-bold">RL</span>
        </div>
        <span className="font-bold text-[11px] flex-1">RiftLens</span>
        <span className="text-[9px] text-red-400 font-bold animate-pulse">● LIVE</span>
      </div>

      {/* Streamer card */}
      <div className="px-3 py-2 space-y-1.5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Image
            src={getRankIconUrl(streamer.tier)}
            alt={streamer.tier}
            width={20}
            height={20}
          />
          <div className="flex-1">
            <p className="font-bold text-[11px]">
              {streamer.name}
              <span className="text-white/50 font-normal">#{streamer.tagLine}</span>
            </p>
            <p className="text-white/70">
              {streamer.tier} {streamer.division} · {streamer.lp} LP
            </p>
          </div>
        </div>

        {/* LP bar */}
        <div className="h-1.5 w-full rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${lpPercent}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-white/60">
          <span>WR S2 : {streamer.seasonWinRate}% ({streamer.seasonGames}g)</span>
        </div>

        {/* Session — BIG for viewers */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-base font-bold text-[var(--color-win)]">
            {streamer.sessionWins}W
          </span>
          <span className="text-base font-bold text-[var(--color-loss)]">
            {streamer.sessionLosses}L
          </span>
          <span className="text-base font-bold text-white/80">
            {streamer.sessionWinRate}%
          </span>
        </div>
      </div>

      {/* Match module */}
      {match && (
        <>
          <button
            onClick={() => setMatchExpanded((v) => !v)}
            className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-white/5 transition-colors"
          >
            <span className="font-bold text-[10px] text-white/80">
              MATCH EN COURS
              <span className="ml-1 text-[8px] text-primary border border-primary rounded px-1">
                S2 2026
              </span>
            </span>
            <span className="text-white/40">{matchExpanded ? "▲" : "▼"}</span>
          </button>

          {matchExpanded && (
            <div className="px-3 pb-2 space-y-1">
              <p className="text-[9px] text-white/40 uppercase tracking-wider">Alliés</p>
              {match.allies.map((p) => (
                <PlayerLine key={p.name} player={p} />
              ))}
              <p className="text-[9px] text-white/40 uppercase tracking-wider mt-1">Adversaires</p>
              {match.enemies.map((p) => (
                <PlayerLine key={p.name} player={p} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Objective timers */}
      {match && (match.dragonTimer !== undefined || match.baronTimer !== undefined) && (
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-white/10 text-[10px] font-mono text-white/60">
          {match.dragonTimer !== undefined && (
            <span>🐉 {Math.floor(match.dragonTimer / 60)}:{String(match.dragonTimer % 60).padStart(2, "0")}</span>
          )}
          {match.baronTimer !== undefined && (
            <span>🟣 {Math.floor(match.baronTimer / 60)}:{String(match.baronTimer % 60).padStart(2, "0")}</span>
          )}
        </div>
      )}
    </div>
  )
}
