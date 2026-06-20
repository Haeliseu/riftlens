"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ThemeToggle } from "./ThemeToggle"

export function Navbar() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    // Format: "gameName#TAG" or "gameName TAG"
    const parts = trimmed.includes("#") ? trimmed.split("#") : trimmed.split(" ")
    if (parts.length >= 2) {
      const gameName = parts[0] ?? ""
      const tagLine = parts.slice(1).join("").toUpperCase()
      router.push(`/profile/EUW1/${encodeURIComponent(gameName)}/${tagLine}`)
    }
  }

  return (
    <header className="flex h-14 items-center border-b px-4 gap-4">
      <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Joueur#EUW…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-9 w-full rounded-md border bg-transparent pl-9 pr-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Rechercher
        </button>
      </form>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
