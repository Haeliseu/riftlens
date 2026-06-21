"use client"

import { getChampionIconUrl, isSummonersRift } from "@riftlens/riot-api"
import Link from "next/link"
import { useState } from "react"
import { type MatchDetailParticipant, useMatchDetail } from "@/hooks/useMatchDetail"
import { useMatchTimeline } from "@/hooks/useMatchTimeline"

interface MatchDetailPanelProps {
  matchId: string
  region: string
  ownerPuuid?: string | null
}

const SKILL_LABEL = ["", "Q", "W", "E", "R"]

function BuildSkillOrder({
  matchId,
  region,
  puuid,
}: {
  matchId: string
  region: string
  puuid: string
}) {
  const { data, isLoading } = useMatchTimeline(matchId, region, puuid, true)
  if (isLoading) {
    return <p className="text-[11px] text-muted-foreground">Chargement de la timeline…</p>
  }
  if (!data || (data.build.length === 0 && data.skills.length === 0)) return null

  // Skill order grid: for each of Q/W/E/R, mark the level numbers where it was leveled.
  const slotLevels: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] }
  data.skills.forEach((s, i) => slotLevels[s.slot]?.push(i + 1))

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium mb-1">Ordre d'achat</p>
        <div className="flex flex-wrap items-center gap-1">
          {data.build.map((b, i) => (
            <div key={`b-${b.itemId}-${i}`} className="flex flex-col items-center">
              <Icon src={b.icon} size={22} />
              <span className="text-[8px] text-muted-foreground">{b.minute}'</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-medium mb-1">Ordre des sorts</p>
        <div className="space-y-0.5">
          {[1, 2, 3, 4].map((slot) => (
            <div key={slot} className="flex items-center gap-1">
              <span className="w-4 text-[11px] font-semibold">{SKILL_LABEL[slot]}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 18 }, (_, lvl) => {
                  const leveled = slotLevels[slot]?.includes(lvl + 1)
                  return (
                    <span
                      key={lvl}
                      className={`flex h-4 w-4 items-center justify-center rounded text-[8px] ${
                        leveled
                          ? slot === 4
                            ? "bg-red-500/80 text-white"
                            : "bg-blue-500/80 text-white"
                          : "bg-muted"
                      }`}
                    >
                      {leveled ? lvl + 1 : ""}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

type Tab = "general" | "details" | "runes"

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "Général" },
  { id: "details", label: "Détails" },
  { id: "runes", label: "Runes" },
]

// biome-ignore lint/performance/noImgElement: external CDN icons throughout
function Icon({ src, size = 20, alt = "" }: { src: string | null; size?: number; alt?: string }) {
  if (!src) {
    return (
      <span
        className="inline-block rounded bg-muted"
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }
  // biome-ignore lint/performance/noImgElement: external CDN icon
  return <img src={src} alt={alt} width={size} height={size} className="rounded" />
}

function playerHref(region: string, p: MatchDetailParticipant) {
  return `/profile/${region}/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`
}

function GeneralRow({ p, region }: { p: MatchDetailParticipant; region: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="relative flex-shrink-0">
        <Icon src={getChampionIconUrl(p.championId)} size={28} alt={p.championName} />
        <span className="absolute -bottom-1 -right-1 rounded bg-background px-0.5 text-[9px] leading-none">
          {p.champLevel}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {p.spells.map((s, i) => (
          <Icon key={`sp-${p.puuid}-${i}`} src={s} size={13} />
        ))}
      </div>
      {p.runes.keystone && (
        <div className="flex flex-col gap-0.5">
          <Icon src={p.runes.keystone} size={13} />
          <Icon src={p.runes.secondary[0] ?? null} size={13} />
        </div>
      )}
      <Link href={playerHref(region, p)} className="text-xs truncate hover:underline w-24 min-w-0">
        {p.gameName || p.championName}
      </Link>
      <span className="text-[11px] font-mono text-muted-foreground w-14 text-right">
        {p.kills}/{p.deaths}/{p.assists}
      </span>
      <div className="ml-auto flex gap-0.5">
        {p.items.map((it, i) => (
          <Icon key={`it-${p.puuid}-${i}`} src={it} size={20} />
        ))}
        <Icon src={p.trinket} size={20} />
      </div>
    </div>
  )
}

function Teams({
  data,
  region,
  render,
}: {
  data: MatchDetailParticipant[]
  region: string
  render: (p: MatchDetailParticipant) => React.ReactNode
}) {
  const blue = data.filter((p) => p.teamId === 100)
  const red = data.filter((p) => p.teamId === 200)
  const blueWin = blue[0]?.win ?? false
  return (
    <div className="space-y-3">
      <div>
        <p className={`text-xs font-semibold mb-1 ${blueWin ? "text-green-500" : "text-red-500"}`}>
          Équipe bleue · {blueWin ? "Victoire" : "Défaite"}
        </p>
        {blue.map((p) => (
          <div key={p.puuid}>{render(p)}</div>
        ))}
      </div>
      <div>
        <p className={`text-xs font-semibold mb-1 ${blueWin ? "text-red-500" : "text-green-500"}`}>
          Équipe rouge · {blueWin ? "Défaite" : "Victoire"}
        </p>
        {red.map((p) => (
          <div key={p.puuid}>{render(p)}</div>
        ))}
      </div>
    </div>
  )
}

function DetailsRow({ p, region }: { p: MatchDetailParticipant; region: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-[11px]">
      <Icon src={getChampionIconUrl(p.championId)} size={22} alt={p.championName} />
      <Link href={playerHref(region, p)} className="truncate hover:underline w-20 min-w-0">
        {p.gameName || p.championName}
      </Link>
      <span className="w-16 text-right text-muted-foreground">{p.csPerMin} CS/m</span>
      <span className="w-20 text-right text-muted-foreground">
        {Math.round(p.damage).toLocaleString()} dmg
      </span>
      <span className="w-16 text-right text-muted-foreground">
        {(p.goldEarned / 1000).toFixed(1)}k or
      </span>
      <span className="w-12 text-right text-muted-foreground">{p.visionScore} vis</span>
      <span className="ml-auto w-14 text-right">{p.totalPings} pings</span>
    </div>
  )
}

function RunesRow({ p, region }: { p: MatchDetailParticipant; region: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon src={getChampionIconUrl(p.championId)} size={24} alt={p.championName} />
      <Link href={playerHref(region, p)} className="text-xs truncate hover:underline w-20 min-w-0">
        {p.gameName || p.championName}
      </Link>
      {p.runes.keystone ? (
        <>
          <div className="flex items-center gap-1">
            {p.runes.primary.map((r, i) => (
              <Icon key={`pr-${p.puuid}-${i}`} src={r} size={i === 0 ? 22 : 16} />
            ))}
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1">
            {p.runes.secondary.map((r, i) => (
              <Icon key={`sr-${p.puuid}-${i}`} src={r} size={16} />
            ))}
          </div>
          <div className="ml-auto flex items-center gap-0.5">
            {p.runes.shards.map((r, i) => (
              <Icon key={`sh-${p.puuid}-${i}`} src={r} size={12} />
            ))}
          </div>
        </>
      ) : (
        <span className="text-[11px] text-muted-foreground">—</span>
      )}
    </div>
  )
}

export function MatchDetailPanel({ matchId, region, ownerPuuid }: MatchDetailPanelProps) {
  const [tab, setTab] = useState<Tab>("general")
  const { data, isLoading, isError } = useMatchDetail(matchId, region)

  if (isLoading) {
    return <div className="px-3 py-3 text-xs text-muted-foreground">Chargement du détail…</div>
  }
  if (isError || !data) {
    return <div className="px-3 py-3 text-xs text-muted-foreground">Détail indisponible.</div>
  }

  // Aggregate ping breakdown across all players for the footer.
  const pingTotals = new Map<string, { icon: string; count: number }>()
  for (const p of data.participants) {
    for (const ping of p.pings) {
      const cur = pingTotals.get(ping.label)
      pingTotals.set(ping.label, { icon: ping.icon, count: (cur?.count ?? 0) + ping.count })
    }
  }
  const pingRows = [...pingTotals.entries()].sort((a, b) => b[1].count - a[1].count)
  const totalPings = pingRows.reduce((s, [, v]) => s + v.count, 0)

  return (
    <div className="px-3 py-3">
      <div className="mb-3 flex gap-1 rounded-md bg-muted p-0.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded px-3 py-1 text-xs ${
              tab === t.id ? "bg-background font-medium" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <Teams
          data={data.participants}
          region={region}
          render={(p) => <GeneralRow p={p} region={region} />}
        />
      )}
      {tab === "details" && (
        <>
          <Teams
            data={data.participants}
            region={region}
            render={(p) => <DetailsRow p={p} region={region} />}
          />
          {ownerPuuid && isSummonersRift(data.queueId) && (
            <div className="mt-3 border-t pt-2">
              <BuildSkillOrder matchId={matchId} region={region} puuid={ownerPuuid} />
            </div>
          )}
          <div className="mt-3 border-t pt-2">
            <p className="text-xs font-medium mb-1">Pings de la partie · {totalPings}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
              {pingRows.map(([label, v]) => (
                <span key={label} className="flex items-center gap-1" title={label}>
                  <Icon src={v.icon} size={16} alt={label} />
                  <span className="text-foreground font-medium">{v.count}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}
      {tab === "runes" &&
        (data.participants.some((p) => p.runes.keystone) ? (
          <Teams
            data={data.participants}
            region={region}
            render={(p) => <RunesRow p={p} region={region} />}
          />
        ) : (
          <p className="py-3 text-xs text-muted-foreground">Pas de runes dans ce mode de jeu.</p>
        ))}
    </div>
  )
}
