import { NextRequest } from "next/server";
import fs from "fs/promises";

import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  const volume = await prisma.volume.findUnique({
    where: { id: Number(id) },
  });

  if (!volume || !volume.thumbnailPath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(volume.thumbnailPath);
    return new Response(data, {
      status: 200,
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch (e) {
    console.error(e);
    return new Response("File error", { status: 500 });
  }
}
