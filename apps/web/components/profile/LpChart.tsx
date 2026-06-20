"use client"

import type { TierName } from "@riftlens/riot-api"
import { CURRENT_SEASON_LABEL } from "@riftlens/riot-api"
import { useState } from "react"
import { useLpHistory } from "@/hooks/useLpHistory"

interface LpDataPoint {
  dateMs: number
  tier: TierName
  division: string
  /** y-axis value: absolute ladder value (tierToLP) when available, else raw LP */
  lp: number
  /** LP within the division, for the tooltip */
  leaguePoints?: number
  avgGameRank?: { tier: TierName; division: string }
  isPeak?: boolean
}

interface LpChartProps {
  region: string
  gameName: string
  tagLine: string
  puuid?: string | null
  data?: LpDataPoint[]
}

const CHART_WIDTH = 320
const CHART_HEIGHT = 160
const PADDING = { top: 16, right: 16, bottom: 24, left: 40 }

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(ms))
}

export function LpChart({ data: dataProp, puuid, region = "EUW1" }: LpChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const { data: history } = useLpHistory(dataProp ? null : puuid, region)

  const data: LpDataPoint[] =
    dataProp ??
    (history ?? []).map((p) => ({
      dateMs: new Date(p.recordedAt).getTime(),
      tier: p.tier as TierName,
      division: p.division,
      lp: p.value,
      leaguePoints: p.leaguePoints,
    }))

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">LP Chart</span>
          <span className="text-xs text-muted-foreground">{CURRENT_SEASON_LABEL}</span>
        </div>
        <div
          className="flex items-center justify-center text-center text-muted-foreground text-xs px-4"
          style={{ height: CHART_HEIGHT }}
        >
          L'historique LP se construit à chaque visite du profil (Riot ne fournit pas le passé).
        </div>
      </div>
    )
  }

  const lpValues = data.map((d) => d.lp)
  const minLp = Math.min(...lpValues)
  const maxLp = Math.max(...lpValues)
  const range = maxLp - minLp || 1

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom

  function xPos(i: number) {
    // Single point → centre it (avoid divide-by-zero).
    if (data.length <= 1) return PADDING.left + innerW / 2
    return PADDING.left + (i / (data.length - 1)) * innerW
  }
  function yPos(lp: number) {
    return PADDING.top + innerH - ((lp - minLp) / range) * innerH
  }

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(d.lp)}`).join(" ")

  // v8 ignore next — data[maxI] is always defined within a non-empty array reduce
  const peakIndex = data.reduce((maxI, d, i) => (d.lp > (data[maxI]?.lp ?? 0) ? i : maxI), 0)
  const currentIndex = data.length - 1
  const hoveredPoint = hoverIndex !== null ? data[hoverIndex] : null
  // v8 ignore next — peakIndex always valid within non-empty data
  const peakLp = data[peakIndex]?.lp ?? 0
  // v8 ignore next — currentIndex always valid within non-empty data
  const currentLp = data[currentIndex]?.lp ?? 0

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">LP Chart</span>
        <span className="text-xs text-muted-foreground">{CURRENT_SEASON_LABEL}</span>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        onMouseLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="Graphique LP Saison 2 2026"
      >
        <title>LP Chart S2 2026</title>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={PADDING.left}
            y1={PADDING.top + innerH * (1 - t)}
            x2={PADDING.left + innerW}
            y2={PADDING.top + innerH * (1 - t)}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        ))}

        {/* LP line */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2} />

        {/* Hover detection zones — SVG mouse zones, keyboard nav N/A */}
        {data.map((d, i) => {
          const zoneW = data.length > 1 ? innerW / (data.length - 1) : innerW
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: SVG hover zone, not interactive control
            <rect
              key={d.dateMs}
              x={xPos(i) - zoneW / 2}
              y={PADDING.top}
              width={zoneW}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          )
        })}

        {/* Peak marker */}
        <circle cx={xPos(peakIndex)} cy={yPos(peakLp)} r={5} fill="#f59e0b" />
        <text
          x={xPos(peakIndex)}
          y={yPos(peakLp) - 8}
          textAnchor="middle"
          fontSize={9}
          fill="#f59e0b"
        >
          Peak
        </text>

        {/* Current position marker */}
        <circle cx={xPos(currentIndex)} cy={yPos(currentLp)} r={4} fill="#3b82f6" />

        {/* Hover crosshair + tooltip */}
        {hoverIndex !== null && hoveredPoint && (
          <>
            <line
              x1={xPos(hoverIndex)}
              y1={PADDING.top}
              x2={xPos(hoverIndex)}
              y2={PADDING.top + innerH}
              stroke="currentColor"
              strokeOpacity={0.3}
              strokeDasharray="4 2"
              strokeWidth={1}
            />
            <circle cx={xPos(hoverIndex)} cy={yPos(hoveredPoint.lp)} r={3} fill="#6366f1" />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hoverIndex !== null && hoveredPoint && (
        <div className="mt-2 rounded-md border bg-popover p-2 text-xs space-y-0.5">
          <p className="font-medium">{formatDate(hoveredPoint.dateMs)}</p>
          <p>
            {hoveredPoint.tier} {hoveredPoint.division} ·{" "}
            {hoveredPoint.leaguePoints ?? hoveredPoint.lp} LP
          </p>
          {hoveredPoint.avgGameRank && (
            <p className="text-muted-foreground">
              Rang moyen : {hoveredPoint.avgGameRank.tier} {hoveredPoint.avgGameRank.division}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
