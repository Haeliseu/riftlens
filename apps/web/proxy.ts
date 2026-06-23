import { type NextRequest, NextResponse } from "next/server"

// Path-based i18n: English (default) is served at the root; French lives under
// /fr. We rewrite /fr/* to the underlying route and expose the active locale to
// server components via the `x-locale` header.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isFr = pathname === "/fr" || pathname.startsWith("/fr/")

  const headers = new Headers(req.headers)
  headers.set("x-locale", isFr ? "fr" : "en")

  if (isFr) {
    const url = req.nextUrl.clone()
    url.pathname = pathname.replace(/^\/fr/, "") || "/"
    return NextResponse.rewrite(url, { request: { headers } })
  }
  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Skip Next internals, API routes and files with an extension.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
}
