import type { RiotApiClient, RoutingRegion } from "../client"
import { AccountDtoSchema, type AccountDto } from "../types/account"

export async function getAccountByRiotId(
  client: RiotApiClient,
  routing: RoutingRegion,
  gameName: string,
  tagLine: string
): Promise<AccountDto> {
  const url = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  return client.fetch(url, AccountDtoSchema)
}

export async function getAccountByPuuid(
  client: RiotApiClient,
  routing: RoutingRegion,
  puuid: string
): Promise<AccountDto> {
  const url = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`
  return client.fetch(url, AccountDtoSchema)
}
