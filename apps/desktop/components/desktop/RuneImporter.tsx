"use client"

import { useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { toast } from "sonner"

interface RuneImporterProps {
  championName: string
}

export function RuneImporter({ championName }: RuneImporterProps) {
  const [importing, setImporting] = useState(false)

  async function handleImport() {
    setImporting(true)
    try {
      const creds = await invoke<{ port: number; password: string }>("get_lcu_credentials")
      // Fetch suggested rune page for champion from our API
      const res = await fetch(`/api/runes?champion=${encodeURIComponent(championName)}`)
      if (!res.ok) throw new Error("Runes introuvables")
      const runePage = await res.json()

      await invoke("import_rune_page", { credentials: creds, runePage })
      toast.success(`Runes importées pour ${championName}`)
    } catch (err) {
      toast.error(`Erreur d'import : ${String(err)}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <button
      onClick={handleImport}
      disabled={importing}
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {importing ? "Import en cours…" : `Import runes pour ${championName}`}
    </button>
  )
}
