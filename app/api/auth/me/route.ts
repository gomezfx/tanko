import { NextRequest, NextResponse } from "next/server"

import { getUserFromRequest } from "@/lib/auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  return NextResponse.json({
    id: user.id,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
  })
}
