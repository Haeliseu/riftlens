import type { PreviouslyPlayedInfo } from "@riftlens/riot-api"
import { cn } from "@riftlens/ui"

interface MatchRowData {
  matchId: string
  win: boolean
  championName: string
  kills: number
  deaths: number
  assists: number
  lpChange?: number
  gameCreationMs: number
  previouslyPlayed?: PreviouslyPlayedInfo | null
  opponentPuuid?: string
  opponentGameName?: string
}

interface MatchRowProps {
  match: MatchRowData
  onOpponentFilter?: (puuid: string) => void
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (d > 0) return `il y a ${d}j`
  if (h > 0) return `il y a ${h}h`
  return "à l'instant"
}

export function MatchRow({ match, onOpponentFilter }: MatchRowProps) {
  const kda =
    match.deaths === 0
      ? (match.kills + match.assists).toFixed(1)
      : ((match.kills + match.assists) / match.deaths).toFixed(2)

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50",
        match.win
          ? "border-l-4 border-l-[var(--color-win)]"
          : "border-l-4 border-l-[var(--color-loss)]"
      )}
    >
      {/* Win/Loss indicator */}
      <div
        className={cn(
          "h-12 w-1 rounded-full flex-shrink-0",
          match.win ? "bg-[var(--color-win)]" : "bg-[var(--color-loss)]"
        )}
      />

      {/* Champion icon placeholder */}
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
        {match.championName.slice(0, 2)}
      </div>

      {/* KDA */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {match.kills}/{match.deaths}/{match.assists}
          <span className="text-muted-foreground font-normal ml-1 text-xs">({kda} KDA)</span>
        </p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(match.gameCreationMs)}</p>
      </div>

      {/* LP change */}
      {match.lpChange !== undefined && (
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            match.lpChange >= 0 ? "text-[var(--color-win)]" : "text-[var(--color-loss)]"
          )}
        >
          {match.lpChange >= 0 ? "+" : ""}
          {match.lpChange} LP
        </span>
      )}

      {/* Previously played indicator */}
      {match.previouslyPlayed && match.opponentPuuid && (
        <button
          type="button"
          onClick={() => onOpponentFilter?.(match.opponentPuuid ?? "")}
          className="flex flex-col items-center rounded border px-2 py-1 text-xs hover:bg-accent transition-colors"
          title={`${match.previouslyPlayed.totalGames} parties · ${match.previouslyPlayed.asAlly} allié / ${match.previouslyPlayed.asEnemy} ennemi · ${match.previouslyPlayed.wins}V ${match.previouslyPlayed.losses}D`}
        >
          <span className="font-medium">{match.previouslyPlayed.totalGames}×</span>
          <span className="text-muted-foreground">déjà joué</span>
        </button>
      )}
    </div>
  )
}
