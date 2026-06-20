"use client"

import { Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ThemeToggle } from "./ThemeToggle"

const REGIONS = [
  { id: "EUW1", label: "EUW" },
  { id: "NA1", label: "NA" },
  { id: "KR", label: "KR" },
  { id: "EUN1", label: "EUNE" },
  { id: "BR1", label: "BR" },
  { id: "JP1", label: "JP" },
  { id: "OC1", label: "OCE" },
  { id: "TR1", label: "TR" },
]

export function Navbar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("EUW1")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    const sep = trimmed.includes("#") ? "#" : " "
    const parts = trimmed.split(sep)
    if (parts.length < 2) return
    const gameName = parts[0] ?? ""
    const tagLine = parts.slice(1).join("").toUpperCase()
    if (!gameName || !tagLine) return
    router.push(`/profile/${region}/${encodeURIComponent(gameName)}/${tagLine}`)
    setQuery("")
  }

  return (
    <header className="flex h-14 items-center border-b px-4 gap-3">
      <form
        onSubmit={handleSearch}
        className="flex flex-1 items-center gap-0 max-w-md rounded-md border overflow-hidden"
      >
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="bg-muted border-r text-xs font-medium px-2 h-9 focus:outline-none cursor-pointer text-foreground flex-shrink-0"
        >
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Joueur#TAG"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full bg-transparent pl-8 pr-3 text-sm focus:outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/login"
          className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors font-medium"
        >
          Se connecter
        </Link>
      </div>
    </header>
  )
}
