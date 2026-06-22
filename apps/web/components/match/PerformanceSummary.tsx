"use client"

import { getChampionIconUrl, type MatchSummary } from "@riftlens/riot-api"
import { useI18n } from "@/lib/i18n"

function kdaStr(k: number, d: number, a: number): string {
  const r = d === 0 ? k + a : (k + a) / d
  return r.toFixed(2)
}

export function PerformanceSummary({ matches }: { matches: MatchSummary[] }) {
  const { t } = useI18n()
  const n = matches.length
  if (n === 0) return null

  const wins = matches.filter((m) => m.win).length
  const losses = n - wins
  const wr = Math.round((wins / n) * 100)

  const totalK = matches.reduce((s, m) => s + m.kills, 0)
  const totalD = matches.reduce((s, m) => s + m.deaths, 0)
  const totalA = matches.reduce((s, m) => s + m.assists, 0)
  const avgKda = kdaStr(totalK, totalD, totalA)
  const perGameKda = (
    matches.reduce(
      (s, m) => s + (m.deaths === 0 ? m.kills + m.assists : (m.kills + m.assists) / m.deaths),
      0
    ) / n
  ).toFixed(2)
  const avgCarry = Math.round(matches.reduce((s, m) => s + m.carryScore, 0) / n)
  const avgPlacement = (matches.reduce((s, m) => s + m.placement, 0) / n).toFixed(1)
  const mvp = matches.filter((m) => m.badge === "MVP").length
  const ace = matches.filter((m) => m.badge === "ACE").length

  const byChamp = new Map<
    number,
    { id: number; games: number; wins: number; kills: number; deaths: number; assists: number }
  >()
  for (const m of matches) {
    const c = byChamp.get(m.championId) ?? {
      id: m.championId,
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    }
    c.games += 1
    c.wins += m.win ? 1 : 0
    c.kills += m.kills
    c.deaths += m.deaths
    c.assists += m.assists
    byChamp.set(m.championId, c)
  }
  const champs = [...byChamp.values()].sort((a, b) => b.games - a.games).slice(0, 3)

  // Essence-style donut: blue arc (wins) over a red track (losses).
  const R = 34
  const C = 2 * Math.PI * R

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm font-medium mb-3">{t("perf.title", { n })}</p>
      <div className="flex flex-wrap items-center justify-between gap-6">
        {/* WR essence gauge — blue (wins) / red (losses) */}
        <div className="relative flex-shrink-0" style={{ width: 84, height: 84 }}>
          <svg width={84} height={84} viewBox="0 0 84 84">
            <circle cx={42} cy={42} r={R} fill="none" stroke="#ef4444" strokeWidth={8} />
            <circle
              cx={42}
              cy={42}
              r={R}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - wr / 100)}
              transform="rotate(-90 42 42)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold">{wr}%</span>
            <span className="text-[10px] text-muted-foreground">
              <span className="text-blue-500">
                {wins}
                {t("perf.winShort")}
              </span>{" "}
              <span className="text-red-500">
                {losses}
                {t("perf.lossShort")}
              </span>
            </span>
          </div>
        </div>

        {/* Top champions — avatar · WR% + W-L · KDA (DPM-style) */}
        <div className="flex flex-col gap-1.5">
          {champs.map((c) => {
            const cwr = Math.round((c.wins / c.games) * 100)
            return (
              <div key={c.id} className="flex items-center gap-2">
                {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                <img src={getChampionIconUrl(c.id)} alt="" className="h-8 w-8 rounded-md" />
                <div className="leading-tight">
                  <p className="text-xs">
                    <span
                      className={
                        cwr >= 50 ? "text-blue-500 font-semibold" : "text-red-500 font-semibold"
                      }
                    >
                      {cwr}%
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {c.wins}
                      {t("perf.winShort")}-{c.games - c.wins}
                      {t("perf.lossShort")}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {kdaStr(c.kills, c.deaths, c.assists)} {t("perf.kda")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <span className="text-muted-foreground text-xs">{t("perf.kda")}</span>
          <span className="font-medium">{avgKda}</span>
          <span className="text-muted-foreground text-xs">{t("perf.kdaPerGame")}</span>
          <span className="font-medium">{perGameKda}</span>
          <span className="text-muted-foreground text-xs">{t("perf.carryAvg")}</span>
          <span className="font-medium text-violet-400">{avgCarry}</span>
        </div>

        {/* Average rank above MVP / ACE */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-center">
            <p className="text-[11px] text-muted-foreground">{t("perf.avgRank")}</p>
            <p className="text-sm font-bold">
              {avgPlacement}
              <span className="text-muted-foreground font-normal">/10</span>
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-[11px] font-semibold text-amber-400">MVP</p>
              <p className="text-lg font-bold">{mvp}x</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-violet-400">ACE</p>
              <p className="text-lg font-bold">{ace}x</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
