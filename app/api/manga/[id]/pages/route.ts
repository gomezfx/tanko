import { NextRequest, NextResponse } from "next/server"

import { listCbzImageEntries } from "@/lib/cbz"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params
  const id = Number.parseInt(idParam, 10)

  if (Number.isNaN(id)) {
    return NextResponse.json({ message: "Invalid manga id." }, { status: 400 })
  }

  const volume = await prisma.volume.findUnique({ where: { id } })

  if (!volume) {
    return NextResponse.json({ message: "Manga not found." }, { status: 404 })
  }

  try {
    const entries = listCbzImageEntries(volume.filePath)
    return NextResponse.json({ pageCount: entries.length })
  } catch (error) {
    console.error("Error reading CBZ pages", error)
    return NextResponse.json({ message: "Unable to read manga pages." }, { status: 500 })
  }
}
