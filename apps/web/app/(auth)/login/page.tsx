"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n"

/** Official Riot Games logo (Simple Icons). */
function RiotLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M13.458.86 0 7.093l3.353 12.761 2.552-.313-.701-8.024.838-.373 1.447 8.202 4.361-.535-.775-8.857.83-.37 1.591 9.025 4.412-.542-.849-9.708.84-.374 1.74 9.87L24 17.318V3.5Zm.316 19.356.222 1.256L24 23.14v-4.18l-10.22 1.256Z" />
    </svg>
  )
}

export default function LoginPage() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRiot() {
    setLoading(true)
    setError(null)
    const { error: authError } = await authClient.signIn.oauth2({
      providerId: "riot",
      callbackURL: "/",
    })
    if (authError) {
      setError(t("login.riotPending"))
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="text-2xl font-bold">RiftLens</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("login.subtitle")}</p>
        </div>

        <button
          type="button"
          onClick={handleRiot}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2.5 rounded-md bg-[#d13639] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b92d30] disabled:opacity-50"
        >
          <RiotLogo className="h-4 w-4" />
          {loading ? t("login.submitting") : t("login.riot")}
        </button>

        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-xs text-muted-foreground">{t("login.riotInfo")}</p>
      </div>
    </div>
  )
}
