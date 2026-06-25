import { getPlatformStatus } from "@riftlens/riot-api"
import { CACHE, jsonRoute, regionParam } from "@/lib/api-route"
import { riotClient } from "@/lib/riot-client"

interface RawEntry {
  titles?: { locale: string; content: string }[]
  maintenance_status?: string | null
  incident_severities?: string | string[] | null
  updated_at?: string | null
}

function localizedTitle(titles: RawEntry["titles"], locale: string): string {
  if (!titles?.length) return ""
  const want = locale === "fr" ? "fr" : "en"
  return (
    titles.find((t) => t.locale.toLowerCase().startsWith(want))?.content ?? titles[0]?.content ?? ""
  )
}

function entrySeverity(e: RawEntry): "minor" | "critical" {
  const s = Array.isArray(e.incident_severities) ? e.incident_severities[0] : e.incident_severities
  return s === "critical" ? "critical" : "minor"
}

export const GET = jsonRoute(async (req) => {
  const region = regionParam(req)
  const locale = req.nextUrl.searchParams.get("locale") ?? "en"
  const data = await getPlatformStatus(riotClient(), region)

  const incidents = (data.incidents as RawEntry[]).map((e) => ({
    kind: "incident" as const,
    title: localizedTitle(e.titles, locale),
    severity: entrySeverity(e),
    updatedAt: e.updated_at ?? null,
  }))
  const maintenances = (data.maintenances as RawEntry[]).map((e) => ({
    kind: "maintenance" as const,
    title: localizedTitle(e.titles, locale),
    severity: "minor" as const,
    updatedAt: e.updated_at ?? null,
  }))

  const items = [...incidents, ...maintenances]
  const severity = incidents.some((i) => i.severity === "critical")
    ? ("critical" as const)
    : items.length > 0
      ? ("minor" as const)
      : ("ok" as const)

  return { data: { region, severity, items }, cache: CACHE.short }
})
