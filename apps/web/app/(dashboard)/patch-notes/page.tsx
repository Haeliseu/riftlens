import { ExternalLink } from "lucide-react"
import type { Metadata } from "next"
import { localeAlternates } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"
import { fetchRecentPatches, patchLabel, patchNotesHubUrl, patchNotesUrl } from "@/lib/patches"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: t("patch.title"),
    description: t("patch.subtitle"),
    alternates: localeAlternates(await getLocale(), "/patch-notes"),
  }
}

export default async function PatchNotesPage() {
  const t = await getT()
  const locale = await getLocale()
  const versions = await fetchRecentPatches()
  const [latest, ...rest] = versions

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("patch.title")}</h1>
        <p className="text-muted-foreground">{t("patch.subtitle")}</p>
      </div>

      {!latest ? (
        <p className="text-sm text-muted-foreground">{t("patch.unavailable")}</p>
      ) : (
        <>
          {/* Latest patch — highlighted CTA. */}
          <a
            href={patchNotesUrl(latest, locale) ?? patchNotesHubUrl(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 px-5 py-4 transition-colors hover:bg-primary/10"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {t("patch.latest")}
              </p>
              <p className="text-lg font-semibold">Patch {patchLabel(latest)}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              {t("patch.read")}
              <ExternalLink className="h-4 w-4" />
            </span>
          </a>

          {/* Earlier patches. */}
          {rest.length > 0 && (
            <div className="divide-y rounded-xl border">
              {rest.map((v) => (
                <a
                  key={v}
                  href={patchNotesUrl(v, locale) ?? patchNotesHubUrl(locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">Patch {patchLabel(v)}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}

          <a
            href={patchNotesHubUrl(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("patch.all")}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </>
      )}
    </div>
  )
}
