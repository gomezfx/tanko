import { NextRequest, NextResponse } from "next/server"

import { attachSessionCookie, createSession, verifyPassword } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const username = body?.username as string | undefined
  const password = body?.password as string | undefined

  if (!username || !password) {
    return NextResponse.json({ message: "Username and password are required." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })

  if (!user) {
    return NextResponse.json({ message: "Invalid username or password." }, { status: 401 })
  }

  const passwordIsValid = await verifyPassword(password, user.passwordHash)

  if (!passwordIsValid) {
    return NextResponse.json({ message: "Invalid username or password." }, { status: 401 })
  }

  const { token, expiresAt } = await createSession(user.id)
  const response = NextResponse.json({
    id: user.id,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
  })

  attachSessionCookie(response, token, expiresAt)

  return response
}
