import { NextRequest } from "next/server";
import { getThumbnailResponse } from "./utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  return getThumbnailResponse(id);
}
