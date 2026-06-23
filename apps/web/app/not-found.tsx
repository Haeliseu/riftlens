import Link from "next/link"
import { localePath } from "@/lib/i18n/locale-path"
import { getLocale, getT } from "@/lib/i18n/server"

export default async function NotFound() {
  const t = await getT()
  const locale = await getLocale()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">{t("notFound.title")}</h2>
      <Link
        href={localePath(locale, "/")}
        className="text-primary underline underline-offset-4 text-sm"
      >
        {t("notFound.back")}
      </Link>
    </div>
  )
}
