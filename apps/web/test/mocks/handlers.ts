import { HttpResponse, http } from "msw"

export const handlers = [
  http.get("/api/riot/account", () =>
    HttpResponse.json({ puuid: "mock-puuid", gameName: "TestPlayer", tagLine: "EUW" })
  ),
  http.get("/api/riot/ranked", () =>
    HttpResponse.json([{ tier: "DIAMOND", rank: "III", leaguePoints: 80, wins: 450, losses: 445 }])
  ),
  http.get("/api/riot/previously-played", () => HttpResponse.json(null)),
]
