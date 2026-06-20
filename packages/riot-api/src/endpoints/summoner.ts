import type { Region, RiotApiClient } from "../client"
import { type SummonerDto, SummonerDtoSchema } from "../types/summoner"

export async function getSummonerByPuuid(
  client: RiotApiClient,
  region: Region,
  puuid: string
): Promise<SummonerDto> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
  return client.fetch(url, SummonerDtoSchema)
}

export async function getSummonerById(
  client: RiotApiClient,
  region: Region,
  summonerId: string
): Promise<SummonerDto> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}`
  return client.fetch(url, SummonerDtoSchema)
}
