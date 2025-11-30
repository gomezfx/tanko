import { NextResponse, type NextRequest } from "next/server"

const EXCLUDED_PATHS = ["/_next", "/setup", "/api/setup", "/favicon"]

function isExcluded(pathname: string) {
  return EXCLUDED_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}`))
}

async function hasUsers(request: NextRequest) {
  const statusUrl = new URL("/api/setup/status", request.url)

  const response = await fetch(statusUrl, {
    method: "GET",
    cache: "no-store",
    headers: { "x-setup-status-check": "1" },
  })

  if (!response.ok) {
    return true
  }

  const payload = (await response.json()) as { hasUsers?: boolean }
  return Boolean(payload.hasUsers)
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isExcluded(pathname)) {
    return NextResponse.next()
  }

  const userExists = await hasUsers(request)

  if (!userExists) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/setup"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/:path*"],
}
