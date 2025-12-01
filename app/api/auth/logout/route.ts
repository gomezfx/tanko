import { NextRequest, NextResponse } from "next/server"

import { SESSION_COOKIE_NAME, clearSession, expireSessionCookie } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const response = NextResponse.json({ success: true })

  await clearSession(token)
  expireSessionCookie(response)

  return response
}
