import type { PlayerTag, PreviouslyPlayedInfo } from "@riftlens/riot-api"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { BuddyCard } from "../BuddyCard"

const defaultProps = {
  summonerName: "TestPlayer",
  tagLine: "EUW",
  tier: "Diamond" as const,
  division: "III",
  lp: 80,
  championName: "Ahri",
  champWinRate: 50,
  champGames: 87,
  accountWinRate: 55,
  accountGames: 404,
  kda: "4.2",
  tags: [] as PlayerTag[],
}

const prev = (asAlly: number, asEnemy: number): PreviouslyPlayedInfo => ({
  totalGames: asAlly + asEnemy,
  asAlly,
  asEnemy,
  wins: asAlly,
  losses: asEnemy,
  lastPlayedMs: Date.now(),
})

describe("BuddyCard", () => {
  it("renders summoner name and tag", () => {
    render(<BuddyCard {...defaultProps} />)
    expect(screen.getByText(/TestPlayer/)).toBeInTheDocument()
    expect(screen.getByText(/#EUW/)).toBeInTheDocument()
  })

  it("shows rank icon with correct tier", () => {
    render(<BuddyCard {...defaultProps} />)
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("alt", "Diamond")
    expect((img as HTMLImageElement).src).toContain("diamond")
  })

  it("displays champion WR with correct color class (green ≥55%)", () => {
    render(<BuddyCard {...defaultProps} champWinRate={60} />)
    expect(screen.getByText(/WR champ S2/).className).toContain("color-win")
  })

  it("displays champion WR with red color class for <47%", () => {
    render(<BuddyCard {...defaultProps} champWinRate={45} />)
    expect(screen.getByText(/WR champ S2/).className).toContain("color-loss")
  })

  it("displays neutral WR class for 47-54%", () => {
    render(<BuddyCard {...defaultProps} champWinRate={50} />)
    const el = screen.getByText(/WR champ S2/)
    expect(el.className).not.toContain("color-win")
    expect(el.className).not.toContain("color-loss")
  })

  it("shows 'déjà joué' badge (ally > enemy → win color)", () => {
    render(<BuddyCard {...defaultProps} previouslyPlayed={prev(2, 1)} />)
    const badge = screen.getByTitle(/parties/)
    expect(badge.className).toContain("color-win")
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("shows 'déjà joué' badge (enemy > ally → loss color)", () => {
    render(<BuddyCard {...defaultProps} previouslyPlayed={prev(1, 3)} />)
    const badge = screen.getByTitle(/parties/)
    expect(badge.className).toContain("color-loss")
  })

  it("shows 'déjà joué' badge (equal → neutral color)", () => {
    render(<BuddyCard {...defaultProps} previouslyPlayed={prev(2, 2)} />)
    const badge = screen.getByTitle(/parties/)
    expect(badge.className).toContain("muted-foreground")
  })

  it("does not show badge when previouslyPlayed is null", () => {
    render(<BuddyCard {...defaultProps} previouslyPlayed={null} />)
    expect(screen.queryByTitle(/parties/)).toBeNull()
  })

  it("renders 'you' badge for own card", () => {
    render(<BuddyCard {...defaultProps} isSelf />)
    expect(screen.getByText("you")).toBeInTheDocument()
  })

  it("shows session stats when isSelf with session data", () => {
    render(<BuddyCard {...defaultProps} isSelf sessionWins={4} sessionLosses={2} />)
    expect(screen.getByText(/Session/)).toBeInTheDocument()
    expect(screen.getByText("4V")).toBeInTheDocument()
    expect(screen.getByText("2D")).toBeInTheDocument()
  })

  it("does not show session stats without session data", () => {
    render(<BuddyCard {...defaultProps} isSelf />)
    expect(screen.queryByText(/Session/)).toBeNull()
  })

  it("renders tags when provided", () => {
    render(<BuddyCard {...defaultProps} tags={["on-fire", "tilting"] as PlayerTag[]} />)
    expect(screen.getByTitle("on-fire")).toBeInTheDocument()
    expect(screen.getByTitle("tilting")).toBeInTheDocument()
  })

  it("clicking player icon fires onPlayerClick callback", () => {
    const handler = vi.fn()
    render(<BuddyCard {...defaultProps} onPlayerClick={handler} />)
    fireEvent.click(screen.getByRole("button"))
    expect(handler).toHaveBeenCalledWith("TestPlayer", "EUW")
  })
})
