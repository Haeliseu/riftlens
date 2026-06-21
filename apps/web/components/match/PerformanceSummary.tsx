"use client"

import { getChampionIconUrl, type MatchSummary } from "@riftlens/riot-api"

function kdaStr(k: number, d: number, a: number): string {
  const r = d === 0 ? k + a : (k + a) / d
  return r.toFixed(2)
}

export function PerformanceSummary({ matches }: { matches: MatchSummary[] }) {
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
  const mvp = matches.filter((m) => m.badge === "MVP").length
  const ace = matches.filter((m) => m.badge === "ACE").length

  const byChamp = new Map<number, { id: number; games: number; wins: number }>()
  for (const m of matches) {
    const c = byChamp.get(m.championId) ?? { id: m.championId, games: 0, wins: 0 }
    c.games += 1
    c.wins += m.win ? 1 : 0
    byChamp.set(m.championId, c)
  }
  const champs = [...byChamp.values()].sort((a, b) => b.games - a.games).slice(0, 3)

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm font-medium mb-3">Performances sur les {n} dernières parties</p>
      <div className="flex flex-wrap items-center gap-6">
        {/* Win/loss balance bar — blue (wins) vs red (losses), tilts with WR */}
        <div className="min-w-[180px] flex-1">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-blue-500">{wins}V</span>
            <span className="font-bold">{wr}%</span>
            <span className="font-medium text-red-500">{losses}D</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full">
            <div className="bg-blue-500" style={{ width: `${wr}%` }} />
            <div className="bg-red-500" style={{ width: `${100 - wr}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <span className="text-muted-foreground text-xs">KDA</span>
          <span className="font-medium">{avgKda}</span>
          <span className="text-muted-foreground text-xs">KDA moy. / partie</span>
          <span className="font-medium">{perGameKda}</span>
          <span className="text-muted-foreground text-xs">Note de carry moy.</span>
          <span className="font-medium text-violet-400">{avgCarry}</span>
        </div>

        {/* MVP and ACE — separate, label over count */}
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

        {/* Top champions */}
        <div className="ml-auto flex items-center gap-3">
          {champs.map((c) => {
            const cwr = Math.round((c.wins / c.games) * 100)
            return (
              <div key={c.id} className="flex flex-col items-center gap-0.5">
                {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                <img src={getChampionIconUrl(c.id)} alt="" className="h-9 w-9 rounded-md" />
                <span
                  className={`text-[11px] font-medium ${cwr >= 50 ? "text-blue-500" : "text-red-500"}`}
                >
                  {cwr}%
                </span>
                <span className="text-[9px] text-muted-foreground">{c.games}g</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
