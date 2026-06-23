import { db } from "@riftlens/db"
import { profiles } from "@riftlens/db/schema"
import { eq } from "drizzle-orm"
import { Lock } from "lucide-react"
import { headers } from "next/headers"
import { DownloadOptions } from "@/components/download/DownloadOptions"
import { Link } from "@/components/Link"
import { auth } from "@/lib/auth"
import { getT } from "@/lib/i18n/server"

async function isPremium(userId: string): Promise<boolean> {
  const [p] = await db
    .select({ premium: profiles.isPremium })
    .from(profiles)
    .where(eq(profiles.id, userId))
  return p?.premium ?? false
}

export default async function DownloadPage() {
  const t = await getT()
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  const premium = session?.user?.id ? await isPremium(session.user.id) : false

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t("download.title")}</h1>
        <p className="text-muted-foreground">{t("download.subtitle")}</p>
      </header>

      {/* Premium-gated download. */}
      {premium ? (
        <DownloadOptions />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
            <Lock className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">{t("download.premiumTitle")}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{t("download.premiumDesc")}</p>
          {!session?.user ? (
            <Link
              href="/login"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t("nav.login")}
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">{t("download.premiumSoon")}</p>
          )}
        </div>
      )}

      <section className="rounded-xl border bg-card p-5 text-sm text-muted-foreground space-y-2">
        <h2 className="text-base font-semibold text-foreground">{t("download.featuresTitle")}</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("download.feature.overlay")}</li>
          <li>{t("download.feature.champSelect")}</li>
          <li>{t("download.feature.runes")}</li>
        </ul>
      </section>
    </div>
  )
}
