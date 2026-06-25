import { getProfileSummary } from "@riftlens/riot-api"
import { CACHE, HttpError, jsonRoute, regionParam } from "@/lib/api-route"
import { withCache } from "@/lib/cache"
import { riotClient } from "@/lib/riot-client"

export const GET = jsonRoute(async (req) => {
  const { searchParams } = req.nextUrl
  const gameName = searchParams.get("gameName")
  const tagLine = searchParams.get("tagLine")
  if (!gameName || !tagLine) throw new HttpError(400, "Missing gameName or tagLine")
  const region = regionParam(req)

  const summary = await withCache(
    `ps:${region}:${gameName.toLowerCase()}:${tagLine.toLowerCase()}`,
    300,
    () => getProfileSummary(riotClient(), region, gameName, tagLine)
  )
  return { data: summary, cache: CACHE.medium }
})
