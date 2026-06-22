import { Navbar } from "@/components/layout/Navbar"
import { StripQueryParams } from "@/components/layout/StripQueryParams"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <StripQueryParams />
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
