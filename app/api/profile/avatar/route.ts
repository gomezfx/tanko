import fs from "node:fs/promises"
import path from "node:path"

import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

import { getUserFromRequest } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("avatar")

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: "Avatar file is required." }, { status: 400 })
  }

  const fileType = (file.type || "").toLowerCase()

  if (!ALLOWED_TYPES.has(fileType)) {
    return NextResponse.json({ message: "Unsupported file type." }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "File is too large." }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const avatarsDir = path.join(process.cwd(), "public", "avatars")
  await fs.mkdir(avatarsDir, { recursive: true })

  const fileName = `${user.id}-${Date.now()}.jpg`
  const outputPath = path.join(avatarsDir, fileName)

  const processedImage = await sharp(buffer)
    .resize(512, 512, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toBuffer()

  await fs.writeFile(outputPath, processedImage)

  const avatarUrl = `/avatars/${fileName}`

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  })

  return NextResponse.json({ avatarUrl })
}
