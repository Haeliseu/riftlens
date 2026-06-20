import { describe, expect, it } from "vitest"
import { SEASON_2_2026_START_MS } from "../season"
import { aggregatePreviouslyPlayed, type CommonGame } from "../previously-played"

const S2_GAME_TIME = SEASON_2_2026_START_MS + 86400000

describe("Previously played detection", () => {
  it("returns null when no common games exist", () => {
    expect(aggregatePreviouslyPlayed([])).toBeNull()
  })

  it("only considers current season games", () => {
    const games: CommonGame[] = [
      {
        matchId: "old-match",
        myTeamId: 100,
        theirTeamId: 100,
        myWin: true,
        gameCreation: SEASON_2_2026_START_MS - 1, // before season
      },
    ]
    expect(aggregatePreviouslyPlayed(games)).toBeNull()
  })

  it("correctly separates ally vs enemy games", () => {
    const games: CommonGame[] = [
      { matchId: "m1", myTeamId: 100, theirTeamId: 100, myWin: true, gameCreation: S2_GAME_TIME },
      { matchId: "m2", myTeamId: 100, theirTeamId: 200, myWin: false, gameCreation: S2_GAME_TIME },
      { matchId: "m3", myTeamId: 100, theirTeamId: 100, myWin: true, gameCreation: S2_GAME_TIME },
    ]
    const result = aggregatePreviouslyPlayed(games)
    expect(result).not.toBeNull()
    expect(result!.asAlly).toBe(2)
    expect(result!.asEnemy).toBe(1)
  })

  it("counts wins and losses in common games", () => {
    const games: CommonGame[] = [
      { matchId: "m1", myTeamId: 100, theirTeamId: 100, myWin: true, gameCreation: S2_GAME_TIME },
      { matchId: "m2", myTeamId: 100, theirTeamId: 100, myWin: false, gameCreation: S2_GAME_TIME },
      { matchId: "m3", myTeamId: 100, theirTeamId: 100, myWin: true, gameCreation: S2_GAME_TIME },
    ]
    const result = aggregatePreviouslyPlayed(games)
    expect(result!.wins).toBe(2)
    expect(result!.losses).toBe(1)
    expect(result!.totalGames).toBe(3)
  })

  it("returns most recent game timestamp", () => {
    const games: CommonGame[] = [
      { matchId: "m1", myTeamId: 100, theirTeamId: 100, myWin: true, gameCreation: S2_GAME_TIME },
      {
        matchId: "m2",
        myTeamId: 100,
        theirTeamId: 100,
        myWin: true,
        gameCreation: S2_GAME_TIME + 1000,
      },
    ]
    const result = aggregatePreviouslyPlayed(games)
    expect(result!.lastPlayedMs).toBe(S2_GAME_TIME + 1000)
  })
})
