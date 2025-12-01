import { randomBytes, scrypt } from "crypto"
import { promisify } from "util"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { ValidationError, requireLibraryPathClient, validateLibraryPaths } from "@/lib/setup"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>

type AdminPayload = {
  username?: unknown
  email?: unknown
  password?: unknown
}

function validateAdmin(admin: AdminPayload) {
  const username = String(admin?.username ?? "").trim()
  const password = String(admin?.password ?? "")
  const email = String(admin?.email ?? "").trim()

  if (!username) {
    throw new ValidationError("Username is required.")
  }

  return {
    username,
    email: email || null,
    password,
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derivedKey = await scryptAsync(password, salt, 64)
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const adminPayload = body?.admin as AdminPayload
    const libraryPaths = body?.libraryPaths

    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({ message: "Setup has already been completed." }, { status: 400 })
    }

    const admin = validateAdmin(adminPayload)
    const uniquePaths = await validateLibraryPaths(libraryPaths)
    const passwordHash = await hashPassword(admin.password)

    const libraryPathClient = requireLibraryPathClient(prisma)

    await prisma.$transaction([
      prisma.user.create({
        data: {
          username: admin.username,
          email: admin.email,
          passwordHash,
          role: "admin",
        },
      }),
      libraryPathClient.createMany({
        data: uniquePaths.map((path) => ({ path })),
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    console.error(error)
    return NextResponse.json(
      { message: "An unexpected error occurred while completing setup." },
      { status: 500 },
    )
  }
}
