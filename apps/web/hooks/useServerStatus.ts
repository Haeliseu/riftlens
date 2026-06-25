import { useQuery } from "@tanstack/react-query"

export interface StatusItem {
  kind: "incident" | "maintenance"
  title: string
  severity: "minor" | "critical"
  updatedAt: string | null
}

export interface ServerStatus {
  region: string
  severity: "ok" | "minor" | "critical"
  items: StatusItem[]
}

export function useServerStatus(region: string, locale: string) {
  return useQuery({
    queryKey: ["server-status", region, locale],
    queryFn: async () => {
      const res = await fetch(`/api/riot/status?region=${region}&locale=${locale}`)
      if (!res.ok) throw new Error("Status unavailable")
      return (await res.json()) as ServerStatus
    },
    staleTime: 120_000,
    refetchInterval: 300_000,
  })
}
