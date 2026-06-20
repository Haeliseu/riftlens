import { getProfileIconUrl } from "@riftlens/riot-api"

interface ProfileHeaderProps {
  region: string
  gameName: string
  tagLine: string
  profileIconId?: number | null
  summonerLevel?: number | null
}

export function ProfileHeader({
  region,
  gameName,
  tagLine,
  profileIconId,
  summonerLevel,
}: ProfileHeaderProps) {
  const name = gameName
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 flex-shrink-0">
        <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex items-center justify-center text-2xl font-bold">
          {profileIconId != null ? (
            // biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed
            <img
              src={getProfileIconUrl(profileIconId)}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            (name[0]?.toUpperCase() ?? "?")
          )}
        </div>
        {summonerLevel != null && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-background border px-1.5 text-[10px] font-medium">
            {summonerLevel}
          </span>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-bold">
          {name}
          <span className="text-muted-foreground text-lg font-normal ml-1">#{tagLine}</span>
        </h1>
        <p className="text-sm text-muted-foreground">{region}</p>
      </div>
    </div>
  )
}
