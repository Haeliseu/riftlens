import type { Metadata } from "next"
import { getLocale } from "@/lib/i18n/server"
import { RIOT_DISCLAIMER, RIOT_DISCLAIMER_EN } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "RiftLens terms of service and the Riot Games disclaimer.",
  alternates: {
    canonical: "/terms",
    languages: { en: "/terms", fr: "/fr/terms", "x-default": "/terms" },
  },
}

const CONTENT = {
  fr: {
    title: "Conditions d'utilisation",
    updated: "Dernière mise à jour : juin 2026",
    disclaimer: RIOT_DISCLAIMER,
    sections: [
      {
        h: "Service",
        p: "RiftLens est un service gratuit d'analyse de performances sur League of Legends, fourni « en l'état », sans garantie de disponibilité ni d'exactitude des données (qui dépendent de l'API de Riot Games).",
      },
      {
        h: "Utilisation acceptable",
        p: "Tu t'engages à ne pas surcharger le service, à ne pas tenter d'en extraire massivement les données, ni à l'utiliser pour harceler d'autres joueurs. RiftLens n'affiche aucun contenu dégradant envers les joueurs.",
      },
      {
        h: "Données Riot",
        p: "Toutes les données de jeu proviennent de l'API officielle de Riot Games et restent soumises aux conditions et politiques de Riot Games.",
      },
      {
        h: "Évolution",
        p: "Ces conditions peuvent évoluer ; les changements seront publiés sur cette page.",
      },
    ],
  },
  en: {
    title: "Terms of Service",
    updated: "Last updated: June 2026",
    disclaimer: RIOT_DISCLAIMER_EN,
    sections: [
      {
        h: "Service",
        p: "RiftLens is a free League of Legends performance analytics service, provided 'as is', with no guarantee of availability or data accuracy (which depend on the Riot Games API).",
      },
      {
        h: "Acceptable use",
        p: "You agree not to overload the service, not to scrape it at scale, and not to use it to harass other players. RiftLens shows no shaming content about players.",
      },
      {
        h: "Riot data",
        p: "All game data comes from the official Riot Games API and remains subject to Riot Games' terms and policies.",
      },
      {
        h: "Changes",
        p: "These terms may change; updates will be posted on this page.",
      },
    ],
  },
}

export default async function TermsPage() {
  const locale = await getLocale()
  const c = CONTENT[locale]
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{c.title}</h1>
        <p className="text-sm text-muted-foreground">{c.updated}</p>
      </header>
      {c.sections.map((s) => (
        <section key={s.h} className="space-y-1.5">
          <h2 className="text-lg font-semibold">{s.h}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{s.p}</p>
        </section>
      ))}
      <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">{c.disclaimer}</p>
    </article>
  )
}
