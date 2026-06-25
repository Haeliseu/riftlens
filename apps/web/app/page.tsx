import type { LucideIcon } from "lucide-react"
import { Swords, Trophy, Tv, User } from "lucide-react"
import Link from "next/link"
import { PlayerSearch } from "@/components/search/PlayerSearch"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { localePath } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"

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
      {f.hint && <p className="text-xs text-muted-foreground italic">{f.hint}</p>}
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

export default async function HomePage() {
  const t = await getT()
  const locale = await getLocale()
  const lp = (path: string) => localePath(locale, path)

  const features: (Feature & { titleKey: TranslationKey })[] = [
    {
      icon: User,
      titleKey: "home.feature.profile.title",
      title: t("home.feature.profile.title"),
      description: t("home.feature.profile.desc"),
      href: null,
      hint: t("home.feature.profile.hint"),
    },
    {
      icon: Trophy,
      titleKey: "leaderboard.title",
      title: t("leaderboard.title"),
      description: t("home.feature.leaderboard.desc"),
      href: lp("/leaderboard"),
      hint: null,
    },
    {
      icon: Swords,
      titleKey: "champions.title",
      title: t("champions.title"),
      description: t("home.feature.champions.desc"),
      href: lp("/champions"),
      hint: null,
    },
    {
      icon: Tv,
      titleKey: "home.feature.live.title",
      title: t("home.feature.live.title"),
      description: t("home.feature.live.desc"),
      href: null,
      hint: t("home.feature.live.hint"),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-8">
          <Link href={lp("/")} className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-[11px] font-bold text-primary-foreground">RL</span>
            </div>
            <span className="font-bold tracking-tight">RiftLens</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href={lp("/leaderboard")}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {t("leaderboard.title")}
            </Link>
            <Link
              href={lp("/champions")}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {t("champions.title")}
            </Link>
          </nav>
        </div>
        <Link
          href={lp("/login")}
          className="text-sm px-4 py-1.5 rounded-md border border-border hover:bg-accent transition-colors font-medium"
        >
          {t("nav.login")}
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="text-center space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {t("home.season")}
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            {t("home.hero.title1")}
            <br />
            <span className="text-muted-foreground">{t("home.hero.title2")}</span>
          </h1>
          <p className="text-muted-foreground text-lg">{t("home.hero.subtitle")}</p>
        </div>

        <PlayerSearch variant="hero" />

        <p className="text-xs text-muted-foreground">
          {t("home.tryExample")}{" "}
          <Link
            href={lp("/profile/EUW1/Faker/T1")}
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
            <FeatureCard key={f.titleKey} feature={f} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("home.footer.disclaimer")}</span>
        <Link href={lp("/login")} className="hover:text-foreground transition-colors">
          {t("home.footer.cta")}
        </Link>
      </footer>
    </div>
  )
}
