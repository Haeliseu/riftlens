"use client"

import { useQueryClient } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { useI18n } from "@/lib/i18n"

interface RefreshButtonProps {
  puuid?: string | null
  region: string
}

export function RefreshButton({ puuid, region }: RefreshButtonProps) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState<number | null>(null)

  async function run() {
    if (!puuid || busy) return
    setBusy(true)
    setAdded(0)
    let total = 0
    try {
      // Chain bounded batches until the whole season is ingested (cap iterations).
      for (let i = 0; i < 20; i++) {
        const res = await fetch(`/api/riot/sync?puuid=${puuid}&region=${region}`, {
          method: "POST",
        })
        if (!res.ok) break
        const r = (await res.json()) as { added: number; hasMore: boolean }
        total += r.added
        setAdded(total)
        if (!r.hasMore) break
      }
      for (const key of ["champion-stats", "match-history", "average-rank", "lp-history"]) {
        qc.invalidateQueries({ queryKey: [key] })
      }
    } finally {
      setBusy(false)
      setTimeout(() => setAdded(null), 4000)
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={!puuid || busy}
      className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      {busy
        ? t("refresh.syncing", { n: added ?? 0 })
        : added != null
          ? t("refresh.added", { n: added })
          : t("profile.refresh")}
    </button>
  )
}
