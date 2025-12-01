import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"

const scryptAsync = promisify(scrypt)

export const SESSION_COOKIE_NAME = "tanko_session"
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`
}

export async function verifyPassword(password: string, storedHash: string) {
  if (!storedHash.includes(":")) {
    return false
  }

  const [saltHex, keyHex] = storedHash.split(":")
  const salt = Buffer.from(saltHex, "hex")
  const storedKey = Buffer.from(keyHex, "hex")
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer

  if (derivedKey.length !== storedKey.length) {
    return false
  }

  return timingSafeEqual(derivedKey, storedKey)
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export function attachSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })
}

export async function clearSession(token: string | undefined) {
  if (!token) return

  try {
    await prisma.session.delete({ where: { token } })
  } catch (error) {
    console.error(error)
  }
}

export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) {
    return null
  }

  if (session.expiresAt < new Date()) {
    await clearSession(token)
    return null
  }

  return session.user
}

export async function getUserFromCookies() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) {
    return null
  }

  if (session.expiresAt < new Date()) {
    await clearSession(token)
    return null
  }

  return session.user
}

export function expireSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  })
}
