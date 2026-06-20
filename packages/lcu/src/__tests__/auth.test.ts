import { describe, expect, it } from "vitest"
import { buildLcuUrl, parseLcuArgs } from "../client"

describe("LCU auth parsing", () => {
  it("extracts port from process args", () => {
    const args =
      "LeagueClientUx.exe --app-port=54321 --remoting-auth-token=abc123def --region=EUW1"
    const creds = parseLcuArgs(args)
    expect(creds?.port).toBe(54321)
  })

  it("extracts auth token from process args", () => {
    const args =
      "LeagueClientUx.exe --app-port=54321 --remoting-auth-token=abc123def --region=EUW1"
    const creds = parseLcuArgs(args)
    expect(creds?.password).toBe("abc123def")
  })

  it("builds correct base URL", () => {
    const creds = { port: 54321, password: "secret", protocol: "https" as const }
    const url = buildLcuUrl(creds, "/lol-summoner/v1/current-summoner")
    expect(url).toBe("https://127.0.0.1:54321/lol-summoner/v1/current-summoner")
  })

  it("returns null when client not running", () => {
    const args = "some-other-process --arg=value"
    expect(parseLcuArgs(args)).toBeNull()
  })
})
