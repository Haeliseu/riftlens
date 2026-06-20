import Image from "next/image"

interface ProfileHeaderProps {
  region: string
  gameName: string
  tagLine: string
}

export function ProfileHeader({ region, gameName, tagLine }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
        {gameName[0]?.toUpperCase() ?? "?"}
      </div>
      <div>
        <h1 className="text-2xl font-bold">
          {decodeURIComponent(gameName)}
          <span className="text-muted-foreground text-lg font-normal ml-1">#{tagLine}</span>
        </h1>
        <p className="text-sm text-muted-foreground">{region}</p>
      </div>
    </div>
  )
}
