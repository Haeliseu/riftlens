"use client"

import { useRolePerformance } from "@/hooks/useProfilePanels"
import { useI18n } from "@/lib/i18n"
import { roleKey } from "@/lib/roles"

interface Props {
  puuid?: string | null
}

export function RolePerformance({ puuid }: Props) {
  const { t } = useI18n()
  const { data, isLoading } = useRolePerformance(puuid)
  const rows = (data ?? []).filter((r) => r.games > 0)

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-base font-semibold mb-3">{t("roles.title")}</h3>
      {!puuid || (!isLoading && rows.length === 0) ? (
        <p className="text-sm text-muted-foreground py-1">{t("roles.syncHint")}</p>
      ) : (
        <div className="space-y-2">
          <div className="flex text-xs text-muted-foreground uppercase">
            <span className="flex-1">{t("roles.col.role")}</span>
            <span className="w-12 text-right">{t("roles.col.games")}</span>
            <span className="w-12 text-right">{t("roles.col.wr")}</span>
          </div>
          {rows.map((r) => {
            const wr = Math.round((r.wins / r.games) * 100)
            return (
              <div key={r.role} className="flex items-center text-sm">
                <span className="flex-1">{t(roleKey(r.role))}</span>
                <span className="w-12 text-right text-muted-foreground">{r.games}</span>
                <span
                  className={`w-12 text-right font-semibold ${wr >= 50 ? "text-blue-500" : "text-red-500"}`}
                >
                  {wr}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
