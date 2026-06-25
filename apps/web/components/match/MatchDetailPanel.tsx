"use client"

import { isSummonersRift } from "@riftlens/riot-api"
import { Link2 } from "lucide-react"
import { useState } from "react"
import { useMatchDetail } from "@/hooks/useMatchDetail"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { PING_BY_KEY } from "@/lib/pings"
import { BuildSkillOrder } from "./detail/BuildSkillOrder"
import { Icon } from "./detail/shared"
import { DetailsRow, FocusedStats, GeneralRow, RuneCard, Teams } from "./detail/Teams"

interface MatchDetailPanelProps {
  matchId: string
  region: string
  ownerPuuid?: string | null
}

type Tab = "general" | "details" | "runes"

const TABS: { id: Tab; label: TranslationKey }[] = [
  { id: "general", label: "detail.tab.general" },
  { id: "details", label: "detail.tab.details" },
  { id: "runes", label: "detail.tab.runes" },
]

export function MatchDetailPanel({ matchId, region, ownerPuuid }: MatchDetailPanelProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>("general")
  const [copied, setCopied] = useState(false)
  const { data, isLoading, isError } = useMatchDetail(matchId, region)

  function copyLink() {
    const link =
      typeof window !== "undefined"
        ? `${window.location.origin}/match/${region}/${matchId}`
        : matchId
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

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
      const cur = pingTotals.get(ping.key)
      pingTotals.set(ping.key, { icon: ping.icon, count: (cur?.count ?? 0) + ping.count })
    }
  }
  const pingRows = [...pingTotals.entries()].sort((a, b) => b[1].count - a[1].count)
  const totalPings = pingRows.reduce((s, [, v]) => s + v.count, 0)

  // Focused player + their direct lane opponent (for @15 diff and stats block).
  const owner = ownerPuuid ? data.participants.find((p) => p.puuid === ownerPuuid) : undefined
  const laneOpp = owner?.position
    ? data.participants.find((p) => p.teamId !== owner.teamId && p.position === owner.position)
    : undefined

  return (
    <div className="px-3 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-md bg-muted p-0.5 w-fit">
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
        <button
          type="button"
          onClick={copyLink}
          className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          <Link2 className="h-3.5 w-3.5" />
          {copied ? t("detail.copied") : t("detail.copyLink")}
        </button>
      </div>

      {tab === "general" && (
        <Teams
          data={data.participants}
          teams={data.teams}
          render={(p) => <GeneralRow p={p} region={region} />}
        />
      )}
      {tab === "details" && (
        <>
          <Teams data={data.participants} render={(p) => <DetailsRow p={p} region={region} />} />
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
              {pingRows.map(([key, v]) => {
                const f = PING_BY_KEY[key]
                const label = f ? t(f.labelKey) : key
                return (
                  <span key={key} className="flex items-center gap-1" title={label}>
                    <Icon src={v.icon} size={16} alt={label} />
                    <span className="text-foreground font-medium">{v.count}</span>
                  </span>
                )
              })}
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
