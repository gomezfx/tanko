import path from "node:path"
import { mkdir } from "node:fs/promises"

import sharp from "sharp"
import { NextRequest, NextResponse } from "next/server"

import { getUserFromRequest } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("avatar")

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Avatar file is required." }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ message: "Unsupported file type." }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "File is too large." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${user.id}-${Date.now()}.jpg`
  const avatarDir = path.join(process.cwd(), "public", "avatars")

  await mkdir(avatarDir, { recursive: true })

  const outputPath = path.join(avatarDir, fileName)

  try {
    await sharp(buffer)
      .resize(512, 512, { fit: "cover", position: "centre" })
      .jpeg({ quality: 90 })
      .toFile(outputPath)
  } catch (error) {
    console.error("Error processing avatar", error)
    return NextResponse.json({ message: "Unable to process avatar." }, { status: 500 })
  }

  const avatarUrl = `/avatars/${fileName}`

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  })

  return NextResponse.json({ avatarUrl })
}
