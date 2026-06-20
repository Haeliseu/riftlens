import { HttpResponse, http } from "msw"

export const handlers = [
  http.get(
    "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/RATELIMITED/429",
    () =>
      new HttpResponse("Rate Limited", {
        status: 429,
        headers: { "Retry-After": "5" },
      })
  ),
  http.get(
    "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/NOTEXIST/404",
    () => new HttpResponse("Not Found", { status: 404 })
  ),
  http.get("https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/:name/:tag", () =>
    HttpResponse.json({
      puuid: "test-puuid-123",
      gameName: "TestSummoner",
      tagLine: "EUW",
    })
  ),
  http.get("https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/:id", () =>
    HttpResponse.json([
      {
        leagueId: "test-league-id",
        summonerId: "test-summoner-id",
        queueType: "RANKED_SOLO_5x5",
        tier: "DIAMOND",
        rank: "III",
        leaguePoints: 80,
        wins: 450,
        losses: 445,
        hotStreak: false,
        veteran: false,
        freshBlood: false,
        inactive: false,
      },
    ])
  ),
  http.get(
    "https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/:puuid/ids",
    () => HttpResponse.json(["EUW1_1", "EUW1_2"])
  ),
  http.get("https://europe.api.riotgames.com/lol/match/v5/matches/:matchId", ({ params }) =>
    HttpResponse.json({
      metadata: { matchId: params.matchId, participants: ["test-puuid-123"] },
      info: {
        gameId: 1,
        gameCreation: 1745884800000,
        gameDuration: 1800,
        gameMode: "CLASSIC",
        gameType: "MATCHED_GAME",
        queueId: 420,
        participants: [
          {
            puuid: "test-puuid-123",
            teamId: 100,
            championId: 64,
            championName: "LeeSin",
            kills: 8,
            deaths: 3,
            assists: 10,
            win: params.matchId === "EUW1_1",
            totalMinionsKilled: 150,
            neutralMinionsKilled: 50,
            teamPosition: "JUNGLE",
          },
        ],
      },
    })
  ),
  http.get("https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/:puuid", () =>
    HttpResponse.json([
      {
        leagueId: "test-league-id",
        summonerId: "test-summoner-id",
        queueType: "RANKED_FLEX_SR",
        tier: "PLATINUM",
        rank: "I",
        leaguePoints: 12,
        wins: 30,
        losses: 25,
      },
      {
        leagueId: "test-league-id",
        summonerId: "test-summoner-id",
        queueType: "RANKED_SOLO_5x5",
        tier: "DIAMOND",
        rank: "III",
        leaguePoints: 80,
        wins: 450,
        losses: 445,
      },
    ])
  ),
  http.get("https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/:puuid", () =>
    HttpResponse.json({
      id: "test-summoner-id",
      accountId: "test-account-id",
      puuid: "test-puuid-123",
      profileIconId: 1234,
      revisionDate: 1745884800000,
      summonerLevel: 200,
    })
  ),
]
