import { NextResponse, type NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client/edge"

// Edge runtime requires the edge build of Prisma Client.
// Avoid sharing instances across requests to prevent subtle edge caching issues.
const createPrismaClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

const EXCLUDED_PATHS = ["/_next", "/admin/setup", "/api/setup", "/favicon"]

function isExcluded(pathname: string) {
  return EXCLUDED_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isExcluded(pathname)) {
    return NextResponse.next()
  }

  const prisma = createPrismaClient()

  try {
    const userCount = await prisma.user.count()

    if (userCount === 0) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/admin/setup"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next()
  } finally {
    await prisma.$disconnect()
  }
}

export const config = {
  matcher: ["/:path*"],
}
