import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const userCount = await prisma.user.count()
  return NextResponse.json({ hasUsers: userCount > 0 })
}
