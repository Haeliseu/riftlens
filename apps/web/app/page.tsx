import type { LucideIcon } from "lucide-react"
import { Swords, Trophy, Tv, User } from "lucide-react"
import Link from "next/link"
import { SearchHero } from "@/components/home/SearchHero"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  href: string | null
  hint: string | null
}

function FeatureCard({ feature: f }: { feature: Feature }) {
  const Icon = f.icon
  const inner = (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3 h-full transition-colors hover:border-border/80 hover:bg-accent/30">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-sm">{f.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
      </div>
      {f.hint && <p className="text-xs text-muted-foreground/60 italic">{f.hint}</p>}
    </div>
  )
  return f.href ? (
    <Link href={f.href} className="h-full">
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  )
}

const features = [
  {
    icon: User,
    title: "Profil joueur",
    description: "Stats ranked, historique de matchs, évolution LP — pour n'importe quel joueur.",
    href: null,
    hint: "Recherchez un joueur ci-dessus",
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    description: "Top 200 joueurs EUW en temps réel.",
    href: "/leaderboard",
    hint: null,
  },
  {
    icon: Swords,
    title: "Champions",
    description: "Tier list, win rates et stats détaillées par champion.",
    href: "/champions",
    hint: null,
  },
  {
    icon: Tv,
    title: "Live Game",
    description:
      "Analyse en temps réel d'une partie en cours. Connectez-vous pour voir les joueurs déjà rencontrés.",
    href: null,
    hint: "Depuis un profil joueur",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-[11px] font-bold text-primary-foreground">RL</span>
            </div>
            <span className="font-bold tracking-tight">RiftLens</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/champions"
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Champions
            </Link>
          </nav>
        </div>
        <Link
          href="/login"
          className="text-sm px-4 py-1.5 rounded-md border border-border hover:bg-accent transition-colors font-medium"
        >
          Se connecter
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="text-center space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Saison 2 2026
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            Analyse ton jeu.
            <br />
            <span className="text-muted-foreground">Dépasse tes limites.</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Stats détaillées, historique LP, live game et suivi des joueurs rencontrés.
          </p>
        </div>

        <SearchHero />

        <p className="text-xs text-muted-foreground">
          Essayez :{" "}
          <Link
            href="/profile/EUW1/Faker/T1"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Faker#T1
          </Link>
        </p>
      </main>

      {/* Features */}
      <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>RiftLens n'est pas affilié à Riot Games.</span>
        <Link href="/login" className="hover:text-foreground transition-colors">
          Se connecter pour plus de fonctionnalités →
        </Link>
      </footer>
    </div>
  )
}
