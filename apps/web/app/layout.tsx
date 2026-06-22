import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { cookies } from "next/headers"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n/dictionaries"
import { Providers } from "./providers"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RiftLens — LoL Tracker",
  description: "Track your League of Legends performance with RiftLens.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const stored = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined
  const locale: Locale = stored && LOCALES.includes(stored) ? stored : DEFAULT_LOCALE

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={geist.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Providers locale={locale}>{children}</Providers>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
