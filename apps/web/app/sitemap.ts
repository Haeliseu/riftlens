import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/leaderboard", priority: 0.9, changeFrequency: "hourly" as const },
    { path: "/champions", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ]
  return routes.map((r) => ({
    url: `${siteUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
