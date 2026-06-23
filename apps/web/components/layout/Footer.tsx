"use client"

import { Link } from "@/components/Link"
import { useI18n } from "@/lib/i18n"

export function Footer() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-10 border-t bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <p className="text-base font-bold">RiftLens</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("footer.tagline")}</p>
          </div>

          <div className="flex gap-12">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t("footer.nav")}
              </p>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-foreground">
                    {t("sidebar.overview")}
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground">
                    {t("sidebar.leaderboard")}
                  </Link>
                </li>
                <li>
                  <Link href="/champions" className="text-muted-foreground hover:text-foreground">
                    {t("sidebar.champions")}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t("footer.legal")}
              </p>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                    {t("footer.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                    {t("footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="text-muted-foreground hover:text-foreground">
                    {t("account.title")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-muted-foreground">
          {t("footer.disclaimer")}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">{t("footer.rights", { year })}</p>
      </div>
    </footer>
  )
}
