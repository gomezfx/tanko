import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { ValidationError, validateLibraryPaths } from "@/lib/setup"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const paths = body?.paths

    const uniquePaths = await validateLibraryPaths(paths)

    await prisma.libraryPath.createMany({
      data: uniquePaths.map((path) => ({ path })),
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    console.error(error)
    return NextResponse.json(
      { message: "An unexpected error occurred while saving library paths." },
      { status: 500 },
    )
  }
}
