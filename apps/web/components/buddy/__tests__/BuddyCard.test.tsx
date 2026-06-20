import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { BuddyCard } from "../BuddyCard"
import type { PreviouslyPlayedInfo, PlayerTag } from "@riftlens/riot-api"

const defaultProps = {
  summonerName: "TestPlayer",
  tagLine: "EUW",
  tier: "Diamond" as const,
  division: "III",
  lp: 80,
  championName: "Ahri",
  champWinRate: 58,
  champGames: 87,
  accountWinRate: 55,
  accountGames: 404,
  kda: "4.2",
  tags: [] as PlayerTag[],
}

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
    const wrText = screen.getByText(/WR champ S2/)
    expect(wrText.className).toContain("color-win")
  })

  it("displays champion WR with red color class for <47%", () => {
    render(<BuddyCard {...defaultProps} champWinRate={45} />)
    const wrText = screen.getByText(/WR champ S2/)
    expect(wrText.className).toContain("color-loss")
  })

  it("shows 'déjà joué' badge when previouslyPlayed is provided", () => {
    const prev: PreviouslyPlayedInfo = {
      totalGames: 3,
      asAlly: 2,
      asEnemy: 1,
      wins: 2,
      losses: 1,
      lastPlayedMs: Date.now(),
    }
    render(<BuddyCard {...defaultProps} previouslyPlayed={prev} />)
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("does not show badge when previouslyPlayed is null", () => {
    render(<BuddyCard {...defaultProps} previouslyPlayed={null} />)
    expect(screen.queryByTitle(/parties/)).toBeNull()
  })

  it("renders 'you' badge for own card", () => {
    render(<BuddyCard {...defaultProps} isSelf />)
    expect(screen.getByText("you")).toBeInTheDocument()
  })

  it("clicking player icon fires onPlayerClick callback", () => {
    const handler = vi.fn()
    render(<BuddyCard {...defaultProps} onPlayerClick={handler} />)
    const btn = screen.getByRole("button")
    fireEvent.click(btn)
    expect(handler).toHaveBeenCalledWith("TestPlayer", "EUW")
  })
})
