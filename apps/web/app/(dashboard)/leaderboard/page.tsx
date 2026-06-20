import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable"

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Top Challenger Solo/Duo · Saison 2 2026</p>
      </div>
      <LeaderboardTable />
    </div>
  )
}
