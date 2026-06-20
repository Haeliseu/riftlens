"use client"

import { cn } from "@riftlens/ui"
import type { PreviouslyPlayedInfo, PlayerTag, TierName } from "@riftlens/riot-api"
import { getRankIconUrl } from "@riftlens/riot-api"
import Image from "next/image"

interface BuddyCardProps {
  summonerName: string
  tagLine: string
  tier: TierName
  division: string
  lp: number
  championName: string
  champWinRate: number
  champGames: number
  accountWinRate: number
  accountGames: number
  kda: string
  tags: PlayerTag[]
  previouslyPlayed?: PreviouslyPlayedInfo | null
  isSelf?: boolean
  sessionWins?: number
  sessionLosses?: number
  onPlayerClick?: (name: string, tag: string) => void
}

const HEAT_CLASS: Record<string, string> = {
  hot: "bg-[var(--color-heat-hot)]",
  good: "bg-[var(--color-heat-good)]",
  neutral: "bg-[var(--color-heat-neutral)]",
  cold: "bg-[var(--color-heat-cold)]",
}

function getHeatKey(wr: number): string {
  if (wr >= 60) return "hot"
  if (wr >= 53) return "good"
  if (wr >= 47) return "neutral"
  return "cold"
}

const TAG_LABELS: Record<PlayerTag, string> = {
  "on-fire": "🔥",
  tilting: "😤",
  "one-trick": "🎯",
  "carry-potential": "💪",
  "smurf-risk": "🕵️",
  "fed-last-game": "🏆",
}

function getPreviouslyPlayedBadgeClass(info: PreviouslyPlayedInfo): string {
  if (info.asAlly > info.asEnemy) return "border-[var(--color-win)] text-[var(--color-win)]"
  if (info.asEnemy > info.asAlly) return "border-[var(--color-loss)] text-[var(--color-loss)]"
  return "border-muted-foreground text-muted-foreground"
}

export function BuddyCard({
  summonerName,
  tagLine,
  tier,
  division,
  lp,
  championName,
  champWinRate,
  champGames,
  accountWinRate,
  accountGames,
  kda,
  tags,
  previouslyPlayed,
  isSelf = false,
  sessionWins,
  sessionLosses,
  onPlayerClick,
}: BuddyCardProps) {
  const heatKey = getHeatKey(champWinRate)

  return (
    <div
      className={cn(
        "relative flex gap-2 rounded-lg border p-2 transition-colors",
        isSelf && "border-blue-500 bg-blue-500/5"
      )}
    >
      {/* Heat bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg", HEAT_CLASS[heatKey])} />

      <div className="pl-2 flex-1 min-w-0 space-y-1">
        {/* Header row */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPlayerClick?.(summonerName, tagLine)}
            className="relative flex-shrink-0"
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
              {summonerName[0]?.toUpperCase() ?? "?"}
            </div>
            {previouslyPlayed && (
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-background text-[8px] font-bold",
                  getPreviouslyPlayedBadgeClass(previouslyPlayed)
                )}
                title={`${previouslyPlayed.totalGames} parties · ${previouslyPlayed.asAlly} allié / ${previouslyPlayed.asEnemy} ennemi · ${previouslyPlayed.wins}V ${previouslyPlayed.losses}D`}
              >
                {previouslyPlayed.totalGames}
              </span>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">
              {summonerName}
              <span className="text-muted-foreground font-normal">#{tagLine}</span>
              {isSelf && (
                <span className="ml-1 text-[9px] text-blue-400 font-bold">you</span>
              )}
            </p>
            <div className="flex items-center gap-1">
              <Image
                src={getRankIconUrl(tier)}
                alt={tier}
                width={12}
                height={12}
                className="flex-shrink-0"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
              <span className="text-[10px] text-muted-foreground">
                {tier} {division} · {lp} LP
              </span>
            </div>
          </div>
        </div>

        {/* Champion info */}
        <p className="text-[10px] font-medium">{championName}</p>

        {/* Win rates */}
        <div className="space-y-0.5">
          <p
            className={cn(
              "text-[10px]",
              champWinRate >= 55
                ? "text-[var(--color-win)]"
                : champWinRate < 47
                  ? "text-[var(--color-loss)]"
                  : "text-foreground"
            )}
          >
            WR champ S2 : {champWinRate}% ({champGames} games)
          </p>
          <p className="text-[10px] text-muted-foreground">
            WR compte S2 : {accountWinRate}% ({accountGames} games)
          </p>
          <p className="text-[10px] text-muted-foreground">KDA : {kda}</p>
        </div>

        {/* Session (self only) */}
        {isSelf && sessionWins !== undefined && sessionLosses !== undefined && (
          <p className="text-[10px] font-medium">
            Session :{" "}
            <span className="text-[var(--color-win)]">{sessionWins}V</span>{" "}
            <span className="text-[var(--color-loss)]">{sessionLosses}D</span>
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px]" title={tag}>
                {TAG_LABELS[tag]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
