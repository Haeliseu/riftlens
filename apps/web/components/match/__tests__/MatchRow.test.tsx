import type { PreviouslyPlayedInfo } from "@riftlens/riot-api"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MatchRow } from "../MatchRow"

const winMatch = {
  matchId: "EUW1_123",
  win: true,
  championName: "Ahri",
  kills: 10,
  deaths: 2,
  assists: 8,
  gameCreationMs: Date.now() - 3_600_000,
}

const lossMatch = { ...winMatch, win: false }

describe("MatchRow", () => {
  it("renders win with green border", () => {
    const { container } = render(<MatchRow match={winMatch} />)
    const row = container.firstChild as HTMLElement
    expect(row.className).toContain("border-l-[var(--color-win)]")
  })

  it("renders loss with red border", () => {
    const { container } = render(<MatchRow match={lossMatch} />)
    const row = container.firstChild as HTMLElement
    expect(row.className).toContain("border-l-[var(--color-loss)]")
  })

  it("displays KDA in correct format", () => {
    render(<MatchRow match={winMatch} />)
    expect(screen.getByText(/10\/2\/8/)).toBeInTheDocument()
  })

  it("shows LP change with + prefix for gains", () => {
    render(<MatchRow match={{ ...winMatch, lpChange: 18 }} />)
    expect(screen.getByText("+18 LP")).toBeInTheDocument()
  })

  it("renders previously-played indicator when present", () => {
    const prev: PreviouslyPlayedInfo = {
      totalGames: 5,
      asAlly: 3,
      asEnemy: 2,
      wins: 3,
      losses: 2,
      lastPlayedMs: Date.now(),
    }
    render(<MatchRow match={{ ...winMatch, previouslyPlayed: prev, opponentPuuid: "opp-puuid" }} />)
    expect(screen.getByText("5×")).toBeInTheDocument()
  })

  it("clicking indicator calls onOpponentFilter", () => {
    const handler = vi.fn()
    const prev: PreviouslyPlayedInfo = {
      totalGames: 5,
      asAlly: 3,
      asEnemy: 2,
      wins: 3,
      losses: 2,
      lastPlayedMs: Date.now(),
    }
    render(
      <MatchRow
        match={{ ...winMatch, previouslyPlayed: prev, opponentPuuid: "opp-puuid" }}
        onOpponentFilter={handler}
      />
    )
    fireEvent.click(screen.getByText("5×").closest("button")!)
    expect(handler).toHaveBeenCalledWith("opp-puuid")
  })
})
