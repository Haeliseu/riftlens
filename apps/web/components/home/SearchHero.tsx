"use client"

import { Clock, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const REGIONS = [
  { id: "EUW1", label: "EUW" },
  { id: "NA1", label: "NA" },
  { id: "KR", label: "KR" },
  { id: "EUN1", label: "EUNE" },
  { id: "BR1", label: "BR" },
  { id: "JP1", label: "JP" },
  { id: "OC1", label: "OCE" },
  { id: "TR1", label: "TR" },
  { id: "LA1", label: "LAN" },
  { id: "LA2", label: "LAS" },
]

const STORAGE_KEY = "riftlens:recent"
const MAX_RECENT = 5

interface RecentSearch {
  gameName: string
  tagLine: string
  region: string
}

function parseQuery(raw: string): { gameName: string; tagLine: string } | null {
  const trimmed = raw.trim()
  const sep = trimmed.includes("#") ? "#" : " "
  const parts = trimmed.split(sep)
  if (parts.length < 2) return null
  const gameName = parts[0] ?? ""
  const tagLine = parts.slice(1).join("").toUpperCase()
  if (!gameName || !tagLine) return null
  return { gameName, tagLine }
}

export function SearchHero() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("EUW1")
  const [recent, setRecent] = useState<RecentSearch[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setRecent(JSON.parse(stored) as RecentSearch[])
    } catch {}
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function navigate(gameName: string, tagLine: string, reg: string) {
    const next: RecentSearch = { gameName, tagLine, region: reg }
    const updated = [
      next,
      ...recent.filter((r) => r.gameName !== gameName || r.tagLine !== tagLine),
    ].slice(0, MAX_RECENT)
    setRecent(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}
    setOpen(false)
    router.push(`/profile/${reg}/${encodeURIComponent(gameName)}/${tagLine}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseQuery(query)
    if (!parsed) return
    navigate(parsed.gameName, parsed.tagLine, region)
  }

  function removeRecent(idx: number) {
    const updated = recent.filter((_, i) => i !== idx)
    setRecent(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  const showDropdown = open && recent.length > 0 && !query

  return (
    <div ref={ref} className="w-full max-w-xl relative">
      <form
        onSubmit={handleSubmit}
        className="flex gap-0 rounded-xl border bg-card shadow-lg overflow-hidden"
      >
        {/* Region selector */}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="bg-muted border-r text-sm font-medium px-3 py-0 focus:outline-none cursor-pointer text-foreground"
        >
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>

        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Joueur#EUW"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="h-12 w-full bg-transparent pl-9 pr-4 text-sm focus:outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <button
          type="submit"
          className="px-5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          Rechercher
        </button>
      </form>

      {/* Recent searches dropdown */}
      {showDropdown && (
        <div className="absolute top-full mt-1 w-full rounded-xl border bg-card shadow-xl z-50 overflow-hidden">
          <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recherches récentes
          </p>
          {recent.map((r, i) => (
            <div
              key={`${r.gameName}#${r.tagLine}`}
              className="flex items-center px-4 py-2.5 hover:bg-accent transition-colors cursor-pointer group"
            >
              <button
                type="button"
                className="flex items-center gap-3 flex-1 text-left"
                onClick={() => navigate(r.gameName, r.tagLine, r.region)}
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">{r.gameName}</span>
                <span className="text-muted-foreground text-sm">#{r.tagLine}</span>
                <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {REGIONS.find((reg) => reg.id === r.region)?.label ?? r.region}
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeRecent(i)
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
