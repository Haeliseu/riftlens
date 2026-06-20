import { z } from "zod"

export const GameFlowPhaseSchema = z.enum([
  "None",
  "Lobby",
  "Matchmaking",
  "ReadyCheck",
  "ChampSelect",
  "GameStart",
  "InProgress",
  "WaitingForStats",
  "PreEndOfGame",
  "EndOfGame",
  "TerminatedInError",
])

export type GameFlowPhase = z.infer<typeof GameFlowPhaseSchema>
