import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { getLocale } from "@/lib/i18n/server"
import { siteConfig, siteUrl } from "@/lib/seo"
import { Providers } from "./providers"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} — LoL Tracker`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
    languages: { en: "/", fr: "/fr", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — LoL Tracker`,
    description: siteConfig.description,
    url: siteUrl,
    locale: siteConfig.locale,
    alternateLocale: siteConfig.alternateLocale,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — LoL Tracker`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={geist.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Providers>{children}</Providers>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
