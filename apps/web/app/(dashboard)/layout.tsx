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
      <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
        <Footer />
      </main>
    </div>
  )
}
