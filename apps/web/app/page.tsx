import Link from "next/link"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">RiftLens</h1>
      <p className="text-muted-foreground text-lg">Better stats. Better insights. Season 2 2026.</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Se connecter
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-accent"
        >
          Leaderboard
        </Link>
      </div>
    </main>
  )
}
