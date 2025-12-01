import { NextResponse } from "next/server"

import { Prisma } from "@prisma/client"

import { hashPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ValidationError, requireLibraryPathClient, validateLibraryPaths } from "@/lib/setup"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
      const metaColumn =
        typeof error.meta?.column === "string"
          ? error.meta.column
          : typeof (error.meta as Record<string, unknown> | undefined)?.column_name === "string"
            ? (error.meta as { column_name: string }).column_name
            : null
      const missingColumn = metaColumn ?? "a required column"

      return NextResponse.json(
        {
          message:
            "Database schema is out of date. Run `prisma migrate deploy` (or reset/dev) and `prisma generate` to sync migrations.",
          details: `Missing ${missingColumn} on the User table.`,
        },
        { status: 500 },
      )
    }

    console.error(error)
    return NextResponse.json(
      { message: "An unexpected error occurred while completing setup." },
      { status: 500 },
    )
  }
}
