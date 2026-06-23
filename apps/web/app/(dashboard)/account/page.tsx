"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Link } from "@/components/Link"
import { signOut, useSession } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n"

export default function AccountPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch("/api/account/delete", { method: "POST" })
      if (!res.ok) throw new Error("delete failed")
      await signOut()
      router.push("/")
    } catch {
      setError(t("account.deleteError"))
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">{t("account.title")}</h1>

      {isPending ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : !session?.user ? (
        <p className="text-sm text-muted-foreground">
          {t("account.notSignedIn")}{" "}
          <Link href="/login" className="text-primary underline underline-offset-2">
            {t("nav.login")}
          </Link>
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t("account.signedInAs", { name: session.user.name || session.user.email || "—" })}
          </p>

          <section className="space-y-3 rounded-xl border border-red-500/40 bg-red-500/5 p-4">
            <div>
              <h2 className="text-base font-semibold text-red-400">{t("account.deleteTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("account.deleteWarning")}</p>
            </div>

            {confirming ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? t("account.deleting") : t("account.deleteConfirm")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  {t("common.clear")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-md border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                {t("account.delete")}
              </button>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </section>
        </>
      )}
    </div>
  )
}
