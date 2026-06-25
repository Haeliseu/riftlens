"use client"

import { getChampionIconUrl, getRankIconUrl, type TierName } from "@riftlens/riot-api"
import { Bug, Castle, Eye, Flame, Skull, Swords } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "@/components/Link"
import type { MatchDetailParticipant, MatchTeam } from "@/hooks/useMatchDetail"
import { useI18n } from "@/lib/i18n"
import { capitalizeTier, rankLabel, tierColor } from "@/lib/tiers"
import { carryColor, Icon, placementLabel, playerHref } from "./shared"

export function GeneralRow({ p, region }: { p: MatchDetailParticipant; region: string }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-2 py-1">
      {/* placement / MVP / ACE */}
      <div className="w-9 flex-shrink-0 text-center">
        {p.badge ? (
          <span
            className={`rounded px-1 py-0.5 text-[9px] font-bold ${
              p.badge === "MVP"
                ? "bg-amber-400/20 text-amber-400"
                : "bg-violet-400/20 text-violet-400"
            }`}
          >
            {p.badge}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">{placementLabel(p.placement)}</span>
        )}
      </div>

      <div className="relative flex-shrink-0">
        <Icon src={getChampionIconUrl(p.championId)} size={28} alt={p.championName} />
        <span className="absolute -bottom-1 -right-1 rounded bg-background px-0.5 text-[9px] leading-none">
          {p.champLevel}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {p.spells.map((s, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional spell slots
          <Icon key={`sp-${p.puuid}-${i}`} src={s} size={13} />
        ))}
      </div>
      {p.runes.keystone && (
        <div className="flex flex-col gap-0.5">
          <Icon src={p.runes.keystone} size={13} />
          <Icon src={p.runes.secondary[0] ?? null} size={13} />
        </div>
      )}

      {/* name + rank (icon before the label; apex tiers have no division) */}
      <div className="w-24 min-w-0">
        <Link href={playerHref(region, p)} className="block text-xs truncate hover:underline">
          {p.gameName || p.championName}
        </Link>
        {p.tier && (
          <span
            className="flex items-center gap-1 text-[10px]"
            style={{ color: tierColor(p.tier) }}
          >
            {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
            <img
              src={getRankIconUrl(capitalizeTier(p.tier) as TierName)}
              alt=""
              className="h-3.5 w-3.5"
            />
            {rankLabel(t, p.tier, p.division ?? "")}
          </span>
        )}
      </div>

      <div className="flex gap-0.5 flex-shrink-0">
        {p.items.map((it, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional item slots
          <Icon key={`it-${p.puuid}-${i}`} src={it} size={20} />
        ))}
        <Icon src={p.trinket} size={20} />
      </div>

      {/* KDA */}
      <span className="ml-auto w-14 text-right text-[11px] font-mono">
        {p.kills}
        <span className="text-muted-foreground">/</span>
        {p.deaths}
        <span className="text-muted-foreground">/</span>
        {p.assists}
      </span>

      {/* KP + CS/min */}
      <div className="w-12 text-right">
        <p className="text-[11px] font-medium">{p.kp}%</p>
        <p className="text-[10px] text-muted-foreground">
          {p.csPerMin} {t("detail.unitCsM")}
        </p>
      </div>

      {/* damage bar + value */}
      <div className="w-20 flex-shrink-0">
        <p className="text-[11px] text-right">{Math.round(p.damage).toLocaleString()}</p>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-red-500/70"
            style={{ width: `${p.damageShare}%` }}
          />
        </div>
      </div>

      {/* carry score */}
      <span className={`w-8 text-right text-sm font-bold ${carryColor(p.carryScore)}`}>
        {p.carryScore}
      </span>
    </div>
  )
}

function TeamObjectives({ team }: { team: MatchTeam | undefined }) {
  const { t } = useI18n()
  if (!team) return null
  const items: { icon: ReactNode; value: number; label: string }[] = [
    { icon: <Swords className="h-3.5 w-3.5" />, value: team.kills, label: t("obj.kills") },
    { icon: <Castle className="h-3.5 w-3.5" />, value: team.towers, label: t("obj.towers") },
    { icon: <Flame className="h-3.5 w-3.5" />, value: team.dragons, label: t("obj.dragons") },
    { icon: <Skull className="h-3.5 w-3.5" />, value: team.barons, label: t("obj.barons") },
    { icon: <Eye className="h-3.5 w-3.5" />, value: team.heralds, label: t("obj.heralds") },
    { icon: <Bug className="h-3.5 w-3.5" />, value: team.grubs, label: t("obj.grubs") },
  ]
  return (
    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-0.5" title={it.label}>
          {it.icon}
          <span className="font-medium text-foreground">{it.value}</span>
        </span>
      ))}
    </div>
  )
}

export function Teams({
  data,
  render,
  teams,
}: {
  data: MatchDetailParticipant[]
  render: (p: MatchDetailParticipant) => ReactNode
  teams?: MatchTeam[]
}) {
  const { t } = useI18n()
  const blue = data.filter((p) => p.teamId === 100)
  const red = data.filter((p) => p.teamId === 200)
  const blueWin = blue[0]?.win ?? false
  const blueTeam = teams?.find((x) => x.teamId === 100)
  const redTeam = teams?.find((x) => x.teamId === 200)
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className={`text-xs font-semibold ${blueWin ? "text-green-500" : "text-red-500"}`}>
            {blueWin ? t("common.win") : t("common.loss")} · {t("live.blueTeam")}
          </p>
          <TeamObjectives team={blueTeam} />
        </div>
        {blue.map((p) => (
          <div key={p.puuid}>{render(p)}</div>
        ))}
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className={`text-xs font-semibold ${blueWin ? "text-red-500" : "text-green-500"}`}>
            {blueWin ? t("common.loss") : t("common.win")} · {t("live.redTeam")}
          </p>
          <TeamObjectives team={redTeam} />
        </div>
        {red.map((p) => (
          <div key={p.puuid}>{render(p)}</div>
        ))}
      </div>
    </div>
  )
}

export function DetailsRow({ p, region }: { p: MatchDetailParticipant; region: string }) {
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

export function RuneCard({ p, region }: { p: MatchDetailParticipant; region: string }) {
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
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional rune slots
              <Icon key={`pr-${p.puuid}-${i}`} src={r} size={20} />
            ))}
          </div>
          <div className="h-px w-8 bg-border" />
          {/* Secondary */}
          <div className="flex items-center gap-1">
            {p.runes.secondary.map((r, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional rune slots
              <Icon key={`sr-${p.puuid}-${i}`} src={r} size={18} />
            ))}
          </div>
          {/* Stat shards */}
          <div className="flex items-center gap-1">
            {p.runes.shards.map((r, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional shard slots
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

export function FocusedStats({ p }: { p: MatchDetailParticipant }) {
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
