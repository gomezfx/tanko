import { promises as fs } from "fs"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const paths = body?.paths

    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { message: "paths must be a non-empty array." },
        { status: 400 },
      )
    }

    const validatedPaths: string[] = []

    for (const rawPath of paths) {
      const trimmedPath = String(rawPath ?? "").trim()

      if (!trimmedPath) {
        return NextResponse.json({ message: "Path cannot be empty." }, { status: 400 })
      }

      try {
        const stats = await fs.stat(trimmedPath)
        if (!stats.isDirectory()) {
          return NextResponse.json(
            { message: `${trimmedPath} is not a directory.` },
            { status: 400 },
          )
        }
      } catch {
        return NextResponse.json(
          { message: `${trimmedPath} does not exist on the filesystem.` },
          { status: 400 },
        )
      }

      validatedPaths.push(trimmedPath)
    }

    const uniquePaths = Array.from(new Set(validatedPaths))

    await prisma.libraryPath.createMany({
      data: uniquePaths.map((path) => ({ path })),
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "An unexpected error occurred while saving library paths." },
      { status: 500 },
    )
  }
}
