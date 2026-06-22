"use client"

import { BarChart2, Swords, Trophy } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"

const nav: { href: string; icon: typeof BarChart2; label: TranslationKey }[] = [
  { href: "/", icon: BarChart2, label: "nav.home" },
  { href: "/leaderboard", icon: Trophy, label: "sidebar.leaderboard" },
  { href: "/champions", icon: Swords, label: "sidebar.champions" },
]

export function Sidebar() {
  const { t } = useI18n()
  return (
    <aside className="flex w-14 flex-col items-center border-r py-4 gap-4">
      <Link href="/" className="mb-2">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">RL</span>
        </div>
      </Link>
      {nav.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          title={t(label)}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
        >
          <Icon className="h-4 w-4" />
        </Link>
      ))}
    </aside>
  )
}
