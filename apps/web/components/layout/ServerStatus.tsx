"use client"

import { Activity, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useServerStatus } from "@/hooks/useServerStatus"
import { useI18n } from "@/lib/i18n"
import { REGION_IDS, regionBadge } from "@/lib/regions"

const DOT: Record<"ok" | "minor" | "critical", string> = {
  ok: "bg-green-500",
  minor: "bg-amber-500",
  critical: "bg-red-500",
}

export function ServerStatus() {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const [region, setRegion] = useState("EUW1")
  const { data, isLoading } = useServerStatus(region, locale)
  const severity = data?.severity ?? "ok"

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("status.title")}
        title={t("status.title")}
        className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent"
      >
        <Activity className="h-4 w-4 text-muted-foreground" />
        <span
          className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${DOT[severity]}`}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-20"
          onClick={() => setOpen(false)}
          onKeyDown={() => {}}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-xl border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={() => {}}
            role="dialog"
            aria-modal="true"
            aria-label={t("status.title")}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${DOT[severity]}`} />
                <h2 className="font-semibold">{t("status.title")}</h2>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-8 rounded-md border bg-card px-2 text-xs"
                >
                  {REGION_IDS.map((id) => (
                    <option key={id} value={id}>
                      {regionBadge(id).label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={t("status.close")}
                  onClick={() => setOpen(false)}
                  className="rounded p-1 hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto p-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : !data || data.items.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {t("status.ok")}
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.items.map((item, i) => (
                    <li key={`${item.kind}-${i}`} className="flex gap-2.5">
                      <span
                        className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${DOT[item.severity]}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(item.kind === "incident" ? "status.incident" : "status.maintenance")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
