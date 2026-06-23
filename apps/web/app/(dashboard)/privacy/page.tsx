import type { Metadata } from "next"
import { getLocale } from "@/lib/i18n/server"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Quelles données RiftLens collecte, pourquoi, et comment elles sont stockées et protégées.",
  alternates: { canonical: "/privacy" },
}

const CONTENT = {
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : juin 2026",
    sections: [
      {
        h: "Données que nous traitons",
        p: "RiftLens affiche des données publiques issues de l'API officielle de Riot Games : Riot ID (Pseudo#TAG), identifiant de compte chiffré (puuid), rang et historique de parties classées, icône de profil, niveau d'invocateur. Nous ne collectons aucune donnée privée (email, mot de passe) en dehors de la connexion Riot.",
      },
      {
        h: "Connexion Riot (RSO)",
        p: "Si tu te connectes avec ton compte Riot, nous stockons ton puuid et ton Riot ID afin de lier ton profil et de l'actualiser automatiquement. Tu peux demander la suppression de ces données à tout moment.",
      },
      {
        h: "Finalité",
        p: "Ces données servent uniquement à afficher les profils, le classement, le coaching et les parties en direct, et à améliorer le service. Nous ne vendons aucune donnée et n'affichons aucune publicité.",
      },
      {
        h: "Hébergement et conservation",
        p: "Les données sont stockées sur Supabase (PostgreSQL) et mises en cache sur Upstash (Redis). Les données de parties (immuables) sont conservées pour l'historique ; les caches expirent automatiquement.",
      },
      {
        h: "Tes droits",
        p: "Conformément au RGPD, tu peux demander l'accès, la rectification ou la suppression de tes données en nous contactant. Les données publiques Riot restent soumises aux conditions de Riot Games.",
      },
      { h: "Contact", p: "Pour toute question : aris.alexia@outlook.fr." },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: June 2026",
    sections: [
      {
        h: "Data we process",
        p: "RiftLens displays public data from the official Riot Games API: Riot ID (Name#TAG), encrypted account id (puuid), ranked rank and match history, profile icon, summoner level. We do not collect private data (email, password) other than Riot sign-in.",
      },
      {
        h: "Riot Sign-On (RSO)",
        p: "If you sign in with your Riot account, we store your puuid and Riot ID to link your profile and refresh it automatically. You can request deletion of this data at any time.",
      },
      {
        h: "Purpose",
        p: "This data is used solely to display profiles, the leaderboard, coaching and live games, and to improve the service. We never sell data and show no ads.",
      },
      {
        h: "Hosting and retention",
        p: "Data is stored on Supabase (PostgreSQL) and cached on Upstash (Redis). Match data (immutable) is kept for history; caches expire automatically.",
      },
      {
        h: "Your rights",
        p: "Under GDPR you can request access, rectification or deletion of your data by contacting us. Public Riot data remains subject to Riot Games' terms.",
      },
      { h: "Contact", p: "For any question: aris.alexia@outlook.fr." },
    ],
  },
}

export default async function PrivacyPage() {
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
    </article>
  )
}
