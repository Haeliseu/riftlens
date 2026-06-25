import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { SkipLink } from "@/components/layout/SkipLink"
import { StripQueryParams } from "@/components/layout/StripQueryParams"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <StripQueryParams />
      <SkipLink />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col overflow-y-auto">
        {/* grows to fill the viewport so the footer stays pinned to the bottom
            on short pages, but still scrolls when content overflows */}
        <div className="flex-1 p-6">{children}</div>
        <Footer />
      </main>
    </div>
  )
}
