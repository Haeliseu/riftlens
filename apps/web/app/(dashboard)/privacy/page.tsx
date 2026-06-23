import type { Metadata } from "next"
import { getLocale } from "@/lib/i18n/server"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data RiftLens collects, why, and how it is stored and protected.",
  alternates: {
    canonical: "/privacy",
    languages: { en: "/privacy", fr: "/fr/privacy", "x-default": "/privacy" },
  },
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
        h: "Données d'autres joueurs",
        p: "RiftLens affiche et met en cache des données publiques d'autres joueurs (classement, adversaires, alliés) issues de l'API Riot, dans un but d'analyse et d'auto-amélioration. Aucun contenu dégradant n'est affiché. Un joueur peut demander le retrait de ses données publiques en nous contactant.",
      },
      {
        h: "Conservation",
        p: "Les données de parties (immuables) sont conservées pour l'historique. Les caches Redis expirent automatiquement. Le profil d'un compte Riot lié est supprimé sur demande, et les comptes liés restés inactifs de façon prolongée peuvent être purgés.",
      },
      {
        h: "Hébergement",
        p: "Les données sont hébergées sur Supabase (PostgreSQL) et Upstash (Redis), en région Union européenne. Aucune publicité ni aucun traceur tiers n'est utilisé.",
      },
      {
        h: "Stockage local",
        p: "Ton navigateur conserve localement (localStorage) tes recherches récentes pour te les reproposer. Ces données ne quittent pas ton appareil et peuvent être effacées en vidant le stockage du site.",
      },
      {
        h: "Tes droits",
        p: "Conformément au RGPD, tu peux accéder, rectifier ou supprimer tes données. Si tu es connecté avec Riot, la suppression de ton compte (profil + données liées) est disponible depuis ton compte ou via l'endpoint dédié ; sinon, contacte-nous. Les données publiques Riot restent soumises aux conditions de Riot Games.",
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
        h: "Other players' data",
        p: "RiftLens displays and caches other players' public data (leaderboard, opponents, allies) from the Riot API, for analytics and self-improvement. No shaming content is shown. A player may request removal of their public data by contacting us.",
      },
      {
        h: "Retention",
        p: "Match data (immutable) is kept for history. Redis caches expire automatically. A linked Riot account's profile is deleted on request, and linked accounts left inactive for a long time may be purged.",
      },
      {
        h: "Hosting",
        p: "Data is hosted on Supabase (PostgreSQL) and Upstash (Redis), in the European Union region. No ads and no third-party trackers are used.",
      },
      {
        h: "Local storage",
        p: "Your browser keeps your recent searches locally (localStorage) to suggest them again. This data never leaves your device and can be cleared by clearing the site's storage.",
      },
      {
        h: "Your rights",
        p: "Under GDPR you can access, rectify or delete your data. If you signed in with Riot, account deletion (profile + linked data) is available from your account or via the dedicated endpoint; otherwise, contact us. Public Riot data remains subject to Riot Games' terms.",
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
