"use client"

import type { TierName } from "@riftlens/riot-api"
import { CURRENT_SEASON_LABEL } from "@riftlens/riot-api"
import { useState } from "react"

interface LpDataPoint {
  dateMs: number
  tier: TierName
  division: string
  lp: number
  avgGameRank?: { tier: TierName; division: string }
  isPeak?: boolean
}

interface LpChartProps {
  region: string
  gameName: string
  tagLine: string
  data?: LpDataPoint[]
}

const CHART_WIDTH = 320
const CHART_HEIGHT = 160
const PADDING = { top: 16, right: 16, bottom: 24, left: 40 }

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(ms))
}

export function LpChart({ data = [] }: LpChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">LP Chart</span>
          <span className="text-xs text-muted-foreground">{CURRENT_SEASON_LABEL}</span>
        </div>
        <div
          className="flex items-center justify-center text-muted-foreground text-xs"
          style={{ height: CHART_HEIGHT }}
        >
          Aucune donnée disponible
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
    return PADDING.left + (i / (data.length - 1)) * innerW
  }
  function yPos(lp: number) {
    return PADDING.top + innerH - ((lp - minLp) / range) * innerH
  }

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(d.lp)}`).join(" ")

  const peakIndex = data.reduce((maxI, d, i) => (d.lp > (data[maxI]?.lp ?? 0) ? i : maxI), 0)
  const currentIndex = data.length - 1
  const hoveredPoint = hoverIndex !== null ? data[hoverIndex] : null

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
        {data.map((d, i) => (
          // biome-ignore lint/a11y/noStaticElementInteractions: SVG hover zone, not interactive control
          <rect
            key={d.dateMs}
            x={xPos(i) - innerW / (2 * (data.length - 1))}
            y={PADDING.top}
            width={innerW / (data.length - 1)}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}

        {/* Peak marker */}
        <circle cx={xPos(peakIndex)} cy={yPos(data[peakIndex]?.lp ?? 0)} r={5} fill="#f59e0b" />
        <text
          x={xPos(peakIndex)}
          y={yPos(data[peakIndex]?.lp ?? 0) - 8}
          textAnchor="middle"
          fontSize={9}
          fill="#f59e0b"
        >
          Peak
        </text>

        {/* Current position marker */}
        <circle
          cx={xPos(currentIndex)}
          cy={yPos(data[currentIndex]?.lp ?? 0)}
          r={4}
          fill="#3b82f6"
        />

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
            {hoveredPoint.tier} {hoveredPoint.division} · {hoveredPoint.lp} LP
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
