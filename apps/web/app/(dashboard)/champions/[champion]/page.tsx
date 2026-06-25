import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Link } from "@/components/Link"
import {
  type ChampionSpell,
  championSplashUrl,
  cleanText,
  fetchChampion,
  passiveIconUrl,
  SPELL_KEYS,
  spellIconUrl,
} from "@/lib/champion-detail"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { localeAlternates } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ champion: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { champion } = await params
  const locale = await getLocale()
  const data = await fetchChampion(champion, locale)
  if (!data) return { title: champion }
  const { name, title } = data.champion
  return {
    title: `${name} — ${title}`,
    description: cleanText(data.champion.lore).slice(0, 160),
    alternates: localeAlternates(locale, `/champions/${champion}`),
  }
}

const STAT_ROWS: { base: string; grow?: string; label: TranslationKey; mana?: boolean }[] = [
  { base: "hp", grow: "hpperlevel", label: "champion.stat.hp" },
  { base: "mp", grow: "mpperlevel", label: "champion.stat.mp", mana: true },
  { base: "attackdamage", grow: "attackdamageperlevel", label: "champion.stat.ad" },
  { base: "armor", grow: "armorperlevel", label: "champion.stat.armor" },
  { base: "spellblock", grow: "spellblockperlevel", label: "champion.stat.mr" },
  { base: "attackspeed", label: "champion.stat.as" },
  { base: "movespeed", label: "champion.stat.ms" },
  { base: "attackrange", label: "champion.stat.range" },
]

const round = (n: number) => Math.round(n * 100) / 100

function AbilityCard({
  badge,
  name,
  icon,
  description,
  spell,
  t,
}: {
  badge: string
  name: string
  icon: string
  description: string
  spell?: ChampionSpell
  t: Awaited<ReturnType<typeof getT>>
}) {
  return (
    <div className="flex gap-3 rounded-xl border bg-card p-4">
      <div className="flex-shrink-0">
        {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
        <img src={icon} alt="" className="h-12 w-12 rounded-md border" loading="lazy" />
        <p className="mt-1 text-center text-[11px] font-bold text-muted-foreground">{badge}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{name}</p>
        <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{description}</p>
        {spell && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>
              <span className="text-muted-foreground">{t("champion.cooldown")}: </span>
              {spell.cooldownBurn}s
            </span>
            {spell.costBurn !== "0" && (
              <span>
                <span className="text-muted-foreground">{t("champion.cost")}: </span>
                {spell.costBurn}
              </span>
            )}
            {spell.rangeBurn !== "25000" && spell.rangeBurn !== "0" && (
              <span>
                <span className="text-muted-foreground">{t("champion.range")}: </span>
                {spell.rangeBurn}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default async function ChampionPage({ params }: PageProps) {
  const { champion } = await params
  const locale = await getLocale()
  const t = await getT()
  const data = await fetchChampion(champion, locale)
  if (!data) notFound()
  const { champion: c, version } = data

  return (
    <div className="space-y-6">
      <Link
        href="/champions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("champion.back")}
      </Link>

      {/* Splash header */}
      <div className="relative overflow-hidden rounded-xl border">
        {/* Full splash at its natural ratio (no cropping) */}
        {/* biome-ignore lint/performance/noImgElement: external CDN splash */}
        <img src={championSplashUrl(c.id)} alt="" className="block h-auto w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {c.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white"
              >
                {tag}
              </span>
            ))}
            {c.partype && (
              <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white">
                {c.partype}
              </span>
            )}
          </div>
          <h1 className="mt-1.5 text-3xl font-bold text-white">{c.name}</h1>
          <p className="text-sm capitalize text-white/80">{c.title}</p>
        </div>
      </div>

      {/* Lore */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">{t("champion.lore")}</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {cleanText(c.lore)}
        </p>
      </section>

      {/* Base stats */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">{t("champion.baseStats")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STAT_ROWS.filter((r) => !r.mana || (c.stats.mp ?? 0) > 0).map((r) => {
            const base = c.stats[r.base] ?? 0
            const grow = r.grow ? (c.stats[r.grow] ?? 0) : 0
            return (
              <div key={r.base} className="rounded-lg border bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">{t(r.label)}</p>
                <p className="text-sm font-semibold">{round(base)}</p>
                {grow > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    +{round(grow)} {t("champion.perLevel")}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Abilities */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("champion.abilities")}</h2>
        <AbilityCard
          badge={t("champion.passive")}
          name={c.passive.name}
          icon={passiveIconUrl(version, c.passive.image.full)}
          description={cleanText(c.passive.description)}
          t={t}
        />
        {c.spells.map((s, i) => (
          <AbilityCard
            key={s.id}
            badge={SPELL_KEYS[i] ?? "?"}
            name={s.name}
            icon={spellIconUrl(version, s.image.full)}
            description={cleanText(s.description)}
            spell={s}
            t={t}
          />
        ))}
      </section>

      {/* Tips */}
      {(c.allytips.length > 0 || c.enemytips.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {c.allytips.length > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">{t("champion.allyTips")}</h3>
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {c.allytips.map((tip) => (
                  <li key={tip}>{cleanText(tip)}</li>
                ))}
              </ul>
            </div>
          )}
          {c.enemytips.length > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">{t("champion.enemyTips")}</h3>
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {c.enemytips.map((tip) => (
                  <li key={tip}>{cleanText(tip)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
