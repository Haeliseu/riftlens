import { http, HttpResponse } from "msw"

export const handlers = [
  http.get(
    "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/NOTEXIST/404",
    () => new HttpResponse("Not Found", { status: 404 })
  ),
  http.get(
    "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/:name/:tag",
    () =>
      HttpResponse.json({
        puuid: "test-puuid-123",
        gameName: "TestSummoner",
        tagLine: "EUW",
      })
  ),
  http.get(
    "https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/:id",
    () =>
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
    "https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/:puuid",
    () =>
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
