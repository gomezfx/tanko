import { NextResponse } from "next/server";

import { scanLibrary } from "@/lib/library";

export async function POST() {
  try {
    const result = await scanLibrary();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Library scan failed:", error);
    return NextResponse.json({ message: "Failed to scan library." }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ message: "Method not allowed." }, { status: 405 });
}
