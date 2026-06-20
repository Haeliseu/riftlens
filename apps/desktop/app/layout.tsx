import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { Geist } from "next/font/google"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RiftLens Desktop",
}

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={geist.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
