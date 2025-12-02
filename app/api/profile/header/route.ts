import path from "node:path"
import { mkdir } from "node:fs/promises"

import sharp from "sharp"
import { NextRequest, NextResponse } from "next/server"

import { getUserFromRequest } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const HEADER_WIDTH = 1600
const HEADER_HEIGHT = 320

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("header")

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Header image is required." }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ message: "Unsupported file type." }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "File is too large." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${user.id}-header-${Date.now()}.jpg`
  const headerDir = path.join(process.cwd(), "public", "headers")

  await mkdir(headerDir, { recursive: true })

  const outputPath = path.join(headerDir, fileName)

  try {
    await sharp(buffer)
      .resize(HEADER_WIDTH, HEADER_HEIGHT, { fit: "cover", position: "centre" })
      .jpeg({ quality: 90 })
      .toFile(outputPath)
  } catch (error) {
    console.error("Error processing header image", error)
    return NextResponse.json({ message: "Unable to process header image." }, { status: 500 })
  }

  const headerUrl = `/headers/${fileName}`

  await prisma.user.update({
    where: { id: user.id },
    data: { headerUrl },
  })

  return NextResponse.json({ headerUrl })
}
