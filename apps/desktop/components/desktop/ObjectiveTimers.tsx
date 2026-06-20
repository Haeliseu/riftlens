"use client"

interface ObjectiveTimersProps {
  dragonTimer?: number
  baronTimer?: number
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function ObjectiveTimers({ dragonTimer, baronTimer }: ObjectiveTimersProps) {
  if (!dragonTimer && !baronTimer) return null

  return (
    <div className="flex items-center gap-4 rounded-md border bg-card px-3 py-1.5 text-xs font-mono">
      {dragonTimer !== undefined && (
        <span>🐉 {formatTimer(dragonTimer)}</span>
      )}
      {baronTimer !== undefined && (
        <span>🟣 {formatTimer(baronTimer)}</span>
      )}
    </div>
  )
}
