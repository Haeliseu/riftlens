"use client"

import { getChampionIconUrl, isSummonersRift } from "@riftlens/riot-api"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { type MatchDetailParticipant, useMatchDetail } from "@/hooks/useMatchDetail"
import { useMatchTimeline } from "@/hooks/useMatchTimeline"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"

interface MatchDetailPanelProps {
  matchId: string
  region: string
  ownerPuuid?: string | null
}

const SKILL_LABEL = ["", "Q", "W", "E", "R"]
const SKILL_COLOR: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-blue-500", text: "text-blue-400" },
  2: { bg: "bg-amber-500", text: "text-amber-400" },
  3: { bg: "bg-violet-500", text: "text-violet-400" },
  4: { bg: "bg-red-500", text: "text-red-400" },
}

function diffColor(v: number): string {
  return v > 0 ? "text-green-500" : v < 0 ? "text-red-500" : "text-muted-foreground"
}

function BuildSkillOrder({
  matchId,
  region,
  puuid,
  oppPuuid,
  championId,
}: {
  matchId: string
  region: string
  puuid: string
  oppPuuid?: string | null
  championId?: number
}) {
  const { t } = useI18n()
  const { data, isLoading } = useMatchTimeline(matchId, region, puuid, true, oppPuuid, championId)
  if (isLoading) {
    return <p className="text-[11px] text-muted-foreground">{t("detail.loadingTimeline")}</p>
  }
  if (!data || (data.build.length === 0 && data.skills.length === 0)) return null

  // Skill order grid: for each of Q/W/E/R, mark the level numbers where it was leveled.
  const slotLevels: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] }
  data.skills.forEach((s, i) => slotLevels[s.slot]?.push(i + 1))
  const a = data.at15

  return (
    <div className="space-y-4">
      {a && (
        <div>
          <p className="text-xs font-semibold mb-2 uppercase text-muted-foreground">
            {t("detail.laning15")}{" "}
            {a.csDiff !== null && (
              <span className="font-normal normal-case text-muted-foreground/70">
                {t("detail.vsLaneOpp")}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">{t("detail.cs")} </span>
              <span className="font-medium">{a.cs}</span>
              {a.csDiff !== null && (
                <span className={`ml-1 text-xs ${diffColor(a.csDiff)}`}>
                  {a.csDiff > 0 ? "+" : ""}
                  {a.csDiff}
                </span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground text-xs">{t("detail.gold")} </span>
              <span className="font-medium">{(a.gold / 1000).toFixed(1)}k</span>
              {a.goldDiff !== null && (
                <span className={`ml-1 text-xs ${diffColor(a.goldDiff)}`}>
                  {a.goldDiff > 0 ? "+" : ""}
                  {a.goldDiff}
                </span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground text-xs">{t("detail.xp")} </span>
              <span className="font-medium">{a.xp}</span>
              {a.xpDiff !== null && (
                <span className={`ml-1 text-xs ${diffColor(a.xpDiff)}`}>
                  {a.xpDiff > 0 ? "+" : ""}
                  {a.xpDiff}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase text-muted-foreground">
          {t("detail.build")}
        </p>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {data.build.map((b, i) => (
            <div key={`b-${b.itemId}-${i}`} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="rounded-md ring-1 ring-border">
                  <Icon src={b.icon} size={28} />
                </div>
                <span className="text-[9px] text-muted-foreground mt-0.5">{b.minute}'</span>
              </div>
              {i < data.build.length - 1 && (
                <ChevronRight className="mx-0.5 h-3 w-3 text-muted-foreground/60 self-start mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold mb-2 uppercase text-muted-foreground">
          {t("detail.skillOrder")}
        </p>
        <div className="space-y-1">
          {[1, 2, 3, 4].map((slot) => (
            <div key={slot} className="flex items-center gap-1.5">
              <div className="relative flex-shrink-0">
                {data.spellIcons?.[slot - 1] ? (
                  <Icon src={data.spellIcons[slot - 1] ?? null} size={20} />
                ) : (
                  <span
                    className={`block w-5 text-center text-xs font-bold ${SKILL_COLOR[slot]?.text}`}
                  >
                    {SKILL_LABEL[slot]}
                  </span>
                )}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 18 }, (_, lvl) => {
                  const leveled = slotLevels[slot]?.includes(lvl + 1)
                  return (
                    <span
                      key={lvl}
                      className={`flex h-4 w-4 items-center justify-center rounded text-[8px] font-medium ${
                        leveled
                          ? `${SKILL_COLOR[slot]?.bg} text-white`
                          : "bg-muted/60 text-muted-foreground/40"
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

const TABS: { id: Tab; label: TranslationKey }[] = [
  { id: "general", label: "detail.tab.general" },
  { id: "details", label: "detail.tab.details" },
  { id: "runes", label: "detail.tab.runes" },
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
  const { t } = useI18n()
  const blue = data.filter((p) => p.teamId === 100)
  const red = data.filter((p) => p.teamId === 200)
  const blueWin = blue[0]?.win ?? false
  return (
    <div className="space-y-3">
      <div>
        <p className={`text-xs font-semibold mb-1 ${blueWin ? "text-green-500" : "text-red-500"}`}>
          {t("live.blueTeam")} · {blueWin ? t("common.win") : t("common.loss")}
        </p>
        {blue.map((p) => (
          <div key={p.puuid}>{render(p)}</div>
        ))}
      </div>
      <div>
        <p className={`text-xs font-semibold mb-1 ${blueWin ? "text-red-500" : "text-green-500"}`}>
          {t("live.redTeam")} · {blueWin ? t("common.loss") : t("common.win")}
        </p>
        {red.map((p) => (
          <div key={p.puuid}>{render(p)}</div>
        ))}
      </div>
    </div>
  )
}

function DetailsRow({ p, region }: { p: MatchDetailParticipant; region: string }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-2 py-1 text-[11px]">
      <Icon src={getChampionIconUrl(p.championId)} size={22} alt={p.championName} />
      <Link href={playerHref(region, p)} className="truncate hover:underline w-20 min-w-0">
        {p.gameName || p.championName}
      </Link>
      <span className="w-16 text-right text-muted-foreground">
        {p.csPerMin} {t("detail.unitCsM")}
      </span>
      <span className="w-20 text-right text-muted-foreground">
        {Math.round(p.damage).toLocaleString()} {t("detail.unitDmg")}
      </span>
      <span className="w-16 text-right text-muted-foreground">
        {(p.goldEarned / 1000).toFixed(1)}k {t("detail.unitGold")}
      </span>
      <span className="w-12 text-right text-muted-foreground">
        {p.visionScore} {t("detail.unitVision")}
      </span>
      <span className="ml-auto w-14 text-right">
        {p.totalPings} {t("detail.unitPings")}
      </span>
    </div>
  )
}

function RuneCard({ p, region }: { p: MatchDetailParticipant; region: string }) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-lg border bg-background/40 p-2 ${
        p.win ? "border-green-500/30" : "border-red-500/30"
      }`}
    >
      <Icon src={getChampionIconUrl(p.championId)} size={30} alt={p.championName} />
      <Link
        href={playerHref(region, p)}
        className="text-[10px] truncate hover:underline w-full text-center"
      >
        {p.gameName || p.championName}
      </Link>
      {p.runes.keystone ? (
        <>
          {/* Keystone */}
          <Icon src={p.runes.keystone} size={34} />
          {/* Primary minor runes */}
          <div className="flex items-center gap-1">
            {p.runes.primary.slice(1).map((r, i) => (
              <Icon key={`pr-${p.puuid}-${i}`} src={r} size={20} />
            ))}
          </div>
          <div className="h-px w-8 bg-border" />
          {/* Secondary */}
          <div className="flex items-center gap-1">
            {p.runes.secondary.map((r, i) => (
              <Icon key={`sr-${p.puuid}-${i}`} src={r} size={18} />
            ))}
          </div>
          {/* Stat shards */}
          <div className="flex items-center gap-1">
            {p.runes.shards.map((r, i) => (
              <Icon key={`sh-${p.puuid}-${i}`} src={r} size={12} />
            ))}
          </div>
        </>
      ) : (
        <span className="py-4 text-[11px] text-muted-foreground">—</span>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  )
}

function FocusedStats({ p }: { p: MatchDetailParticipant }) {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold mb-2 uppercase text-muted-foreground">
          {t("detail.stats")}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Stat label={t("detail.csPerMin")} value={p.csPerMin} />
          <Stat label={t("detail.goldPerMin")} value={p.goldPerMin} />
          <Stat label={t("detail.damage")} value={`${Math.round(p.damage / 1000)}k`} />
          <Stat label={t("detail.damageTaken")} value={`${Math.round(p.damageTaken / 1000)}k`} />
          <Stat label={t("detail.visionPerMin")} value={p.visionPerMin} />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <p className="text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
            {t("detail.wardsTitle")}
          </p>
          <div className="flex gap-4">
            <Stat label={t("detail.wardsPlaced")} value={p.wardsPlaced} />
            <Stat label={t("detail.wardsKilled")} value={p.wardsKilled} />
            <Stat label={t("detail.controlWards")} value={p.controlWards} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
            {t("detail.spellCasts")}
          </p>
          <div className="flex gap-3">
            {(["Q", "W", "E", "R"] as const).map((label, i) => (
              <Stat key={label} label={label} value={p.spellCasts[i] ?? 0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MatchDetailPanel({ matchId, region, ownerPuuid }: MatchDetailPanelProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>("general")
  const { data, isLoading, isError } = useMatchDetail(matchId, region)

  if (isLoading) {
    return (
      <div className="px-3 py-3 text-xs text-muted-foreground">{t("detail.loadingDetail")}</div>
    )
  }
  if (isError || !data) {
    return <div className="px-3 py-3 text-xs text-muted-foreground">{t("detail.unavailable")}</div>
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

  // Focused player + their direct lane opponent (for @15 diff and stats block).
  const owner = ownerPuuid ? data.participants.find((p) => p.puuid === ownerPuuid) : undefined
  const laneOpp =
    owner && owner.position
      ? data.participants.find((p) => p.teamId !== owner.teamId && p.position === owner.position)
      : undefined

  return (
    <div className="px-3 py-3">
      <div className="mb-3 flex gap-1 rounded-md bg-muted p-0.5 w-fit">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded px-3 py-1 text-xs ${
              tab === item.id ? "bg-background font-medium" : "text-muted-foreground"
            }`}
          >
            {t(item.label)}
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
          {owner && (
            <div className="mt-3 border-t pt-2">
              <FocusedStats p={owner} />
            </div>
          )}
          {ownerPuuid && isSummonersRift(data.queueId) && (
            <div className="mt-3 border-t pt-2">
              <BuildSkillOrder
                matchId={matchId}
                region={region}
                puuid={ownerPuuid}
                oppPuuid={laneOpp?.puuid ?? null}
                {...(owner?.championId ? { championId: owner.championId } : {})}
              />
            </div>
          )}
          <div className="mt-3 border-t pt-2">
            <p className="text-xs font-medium mb-1">
              {t("pings.title")} · {totalPings}
            </p>
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
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {data.participants.map((p) => (
              <RuneCard key={p.puuid} p={p} region={region} />
            ))}
          </div>
        ) : (
          <p className="py-3 text-xs text-muted-foreground">{t("detail.noRunes")}</p>
        ))}
    </div>
  )
}
