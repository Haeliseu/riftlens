"use client"

import { useRouter, useSearchParams } from "next/navigation"

const PERIOD_OPTIONS = [
  { value: "all", label: "Tout" },
  { value: "day", label: "Aujourd'hui" },
  { value: "session", label: "Session" },
] as const

export function MatchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const period = searchParams.get("period") ?? "all"

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", value)
    router.push(`?${params}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1 w-fit">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setPeriod(opt.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            period === opt.value
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent text-muted-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
