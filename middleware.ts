import { NextResponse, type NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

const EXCLUDED_PATHS = ["/_next", "/admin/setup", "/api/setup", "/favicon"]

function isExcluded(pathname: string) {
  return EXCLUDED_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isExcluded(pathname)) {
    return NextResponse.next()
  }

  const userCount = await prisma.user.count()

  if (userCount === 0) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/admin/setup"
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/:path*"],
}
