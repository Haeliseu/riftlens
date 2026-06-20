import { BarChart2, Search, Trophy, Swords } from "lucide-react"
import Link from "next/link"

const nav = [
  { href: "/", icon: BarChart2, label: "Accueil" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/champions", icon: Swords, label: "Champions" },
]

export function Sidebar() {
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
          title={label}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
        >
          <Icon className="h-4 w-4" />
        </Link>
      ))}
    </aside>
  )
}
