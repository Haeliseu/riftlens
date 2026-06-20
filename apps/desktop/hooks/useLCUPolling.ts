"use client"

import type { GameFlowPhase } from "@riftlens/lcu"
import { invoke } from "@tauri-apps/api/core"
import { useCallback, useEffect, useState } from "react"

export interface LcuState {
  connected: boolean
  phase: GameFlowPhase
  credentials: { port: number; password: string } | null
}

export function useLCUPolling(intervalMs = 2_000): LcuState {
  const [state, setState] = useState<LcuState>({
    connected: false,
    phase: "None",
    credentials: null,
  })

  const poll = useCallback(async () => {
    try {
      const creds = await invoke<{ port: number; password: string }>("get_lcu_credentials")
      const phase = await invoke<GameFlowPhase>("get_gameflow_phase", { credentials: creds })
      setState({ connected: true, phase, credentials: creds })
    } catch {
      setState({ connected: false, phase: "None", credentials: null })
    }
  }, [])

  useEffect(() => {
    poll()
    const interval = setInterval(poll, intervalMs)
    return () => clearInterval(interval)
  }, [poll, intervalMs])

  return state
}
