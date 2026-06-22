import { getChampionIconUrl } from "@riftlens/riot-api"
import { useI18n } from "@/lib/i18n"
import { roleIconUrl, roleKey } from "@/lib/roles"

interface MatchupVsProps {
  /** The champion the player themselves played. */
  championId: number
  championName: string
  /** Direct lane opponent (may be unknown for some queues/roles). */
  laneOpponentChampionId: number | null
  /** Player position, used for the small role badge. */
  position?: string | null
}

/**
 * Stylised "VS" matchup tile: the player's champion on the left, the lane
 * opponent on the right, split by a diagonal seam with an italic "VS" sitting
 * on it. A small role badge marks the player's position.
 */
export function MatchupVs({
  championId,
  championName,
  laneOpponentChampionId,
  position,
}: MatchupVsProps) {
  const { t } = useI18n()

  // No known opponent → just the player's champ with the role badge.
  if (laneOpponentChampionId == null) {
    return (
      <div className="relative h-11 w-11 flex-shrink-0">
        {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
        <img
          src={getChampionIconUrl(championId)}
          alt={championName}
          className="h-11 w-11 rounded-md"
        />
        {position && <RoleBadge position={position} t={t} />}
      </div>
    )
  }

  return (
    <div
      className="relative h-11 w-[72px] flex-shrink-0 overflow-hidden rounded-md ring-1 ring-border"
      title={`${championName} ${t("history.vs")} ${t("history.laneOpponent")}`}
    >
      {/* Left half — player champion, clipped to a diagonal seam */}
      {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
      <img
        src={getChampionIconUrl(championId)}
        alt={championName}
        className="absolute inset-y-0 left-0 h-11 w-12 object-cover"
        style={{ clipPath: "polygon(0 0, 100% 0, 62% 100%, 0 100%)" }}
      />
      {/* Right half — lane opponent, mirrored diagonal */}
      {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
      <img
        src={getChampionIconUrl(laneOpponentChampionId)}
        alt={t("history.laneOpponent")}
        className="absolute inset-y-0 right-0 h-11 w-12 object-cover"
        style={{ clipPath: "polygon(38% 0, 100% 0, 100% 100%, 0 100%)" }}
      />
      {/* Diagonal seam highlight */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(110deg, transparent calc(50% - 1px), rgba(255,255,255,0.35) 50%, transparent calc(50% + 1px))",
        }}
      />
      {/* "VS" sitting on the seam */}
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-black italic leading-none text-white text-sm"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.9)" }}
      >
        {t("history.vs")}
      </span>
      {position && <RoleBadge position={position} t={t} />}
    </div>
  )
}

function RoleBadge({ position, t }: { position: string; t: ReturnType<typeof useI18n>["t"] }) {
  return (
    <span
      className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-bl-md rounded-tr-md bg-teal-500/90 ring-1 ring-background"
      title={t(roleKey(position))}
    >
      {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
      <img src={roleIconUrl(position)} alt={t(roleKey(position))} className="h-2.5 w-2.5" />
    </span>
  )
}
