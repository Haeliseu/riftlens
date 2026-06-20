import type { PreviouslyPlayedInfo } from "@riftlens/riot-api"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MatchRow } from "../MatchRow"

const base = {
  matchId: "EUW1_123",
  win: true,
  championName: "Ahri",
  kills: 10,
  deaths: 2,
  assists: 8,
  gameCreationMs: Date.now() - 3_600_000 * 25,
}

describe("MatchRow", () => {
  it("renders win with green border class", () => {
    const { container } = render(<MatchRow match={base} />)
    expect((container.firstChild as HTMLElement).className).toContain("border-l-[var(--color-win)]")
  })

  it("renders loss with red border class", () => {
    const { container } = render(<MatchRow match={{ ...base, win: false }} />)
    expect((container.firstChild as HTMLElement).className).toContain(
      "border-l-[var(--color-loss)]"
    )
  })

  it("displays KDA in correct format", () => {
    render(<MatchRow match={base} />)
    expect(screen.getByText(/10\/2\/8/)).toBeInTheDocument()
  })

  it("shows relative time in days for old match", () => {
    render(<MatchRow match={base} />)
    expect(screen.getByText(/il y a \d+j/)).toBeInTheDocument()
  })

  it("shows relative time in hours for match < 24h ago", () => {
    render(<MatchRow match={{ ...base, gameCreationMs: Date.now() - 3_600_000 * 3 }} />)
    expect(screen.getByText(/il y a \d+h/)).toBeInTheDocument()
  })

  it("shows 'à l'instant' for match < 1h ago", () => {
    render(<MatchRow match={{ ...base, gameCreationMs: Date.now() - 60_000 * 10 }} />)
    expect(screen.getByText(/à l'instant/)).toBeInTheDocument()
  })

  it("shows LP gain with + prefix", () => {
    render(<MatchRow match={{ ...base, lpChange: 18 }} />)
    expect(screen.getByText("+18 LP")).toBeInTheDocument()
  })

  it("shows LP loss with - prefix", () => {
    render(<MatchRow match={{ ...base, win: false, lpChange: -15 }} />)
    expect(screen.getByText("-15 LP")).toBeInTheDocument()
  })

  it("hides LP change when not provided", () => {
    render(<MatchRow match={base} />)
    expect(screen.queryByText(/LP/)).toBeNull()
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
    render(<MatchRow match={{ ...base, previouslyPlayed: prev, opponentPuuid: "opp" }} />)
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
        match={{ ...base, previouslyPlayed: prev, opponentPuuid: "opp-puuid" }}
        onOpponentFilter={handler}
      />
    )
    fireEvent.click(screen.getByText("5×").closest("button")!)
    expect(handler).toHaveBeenCalledWith("opp-puuid")
  })

  it("does not render indicator when opponentPuuid is missing", () => {
    const prev: PreviouslyPlayedInfo = {
      totalGames: 5,
      asAlly: 3,
      asEnemy: 2,
      wins: 3,
      losses: 2,
      lastPlayedMs: Date.now(),
    }
    render(<MatchRow match={{ ...base, previouslyPlayed: prev }} />)
    expect(screen.queryByText("5×")).toBeNull()
  })
})
