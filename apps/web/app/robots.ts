import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Don't index API responses or auth-only routes.
      disallow: ["/api/", "/login", "/callback"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
