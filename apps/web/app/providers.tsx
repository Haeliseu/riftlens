"use client"

import { I18nProvider } from "@/lib/i18n"

/**
 * Global providers (every route). Kept minimal so the landing/auth pages stay
 * light — react-query lives in the dashboard layout (QueryProvider), the only
 * place it's used.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>
}
