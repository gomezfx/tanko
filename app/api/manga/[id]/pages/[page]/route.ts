import { NextRequest, NextResponse } from "next/server"

import { getCbzImagePage } from "@/lib/cbz"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; page: string }> }) {
  const { id: idParam, page: pageParam } = await params

  const id = Number.parseInt(idParam, 10)
  const pageIndex = Number.parseInt(pageParam, 10)

  if (Number.isNaN(id) || Number.isNaN(pageIndex) || pageIndex < 0) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 })
  }

  const volume = await prisma.volume.findUnique({ where: { id } })

  if (!volume) {
    return NextResponse.json({ message: "Manga not found." }, { status: 404 })
  }

  try {
    const { data, mimeType } = getCbzImagePage(volume.filePath, pageIndex)
    return new NextResponse(data, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Error reading manga page", error)
    return NextResponse.json({ message: "Unable to read requested page." }, { status: 404 })
  }
}
