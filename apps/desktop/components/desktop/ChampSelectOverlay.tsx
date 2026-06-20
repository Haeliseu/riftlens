"use client"

import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { BuddyPanel } from "@riftlens/ui/../../../apps/web/components/buddy/BuddyPanel"
import type { BuddyData } from "@riftlens/ui/../../../apps/web/components/buddy/BuddyPanel"
import { RuneImporter } from "./RuneImporter"

export function ChampSelectOverlay() {
  const [buddies, setBuddies] = useState<BuddyData[]>([])
  const [loading, setLoading] = useState(true)
  const [myChampion, setMyChampion] = useState<string | null>(null)

  useEffect(() => {
    async function loadSession() {
      try {
        const creds = await invoke<{ port: number; password: string }>("get_lcu_credentials")
        const data = await invoke<BuddyData[]>("get_champ_select_buddies", { credentials: creds })
        setBuddies(data)
        const self = data.find((b) => b.isSelf)
        if (self?.championName) setMyChampion(self.championName)
      } catch {
        // LCU not running
      } finally {
        setLoading(false)
      }
    }

    loadSession()
    const interval = setInterval(loadSession, 2_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-4 space-y-4 min-h-screen bg-background">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary-foreground">RL</span>
        </div>
        <span className="font-bold text-sm">Champ Select</span>
        <span className="ml-auto text-xs text-muted-foreground">EUW1</span>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          Connexion au client…
        </div>
      ) : buddies.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          Aucune session en cours
        </div>
      ) : (
        <>
          <BuddyPanel region="EUW1" buddies={buddies} />
          {myChampion && <RuneImporter championName={myChampion} />}
        </>
      )}
    </div>
  )
}
