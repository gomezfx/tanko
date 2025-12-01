import { NextRequest } from "next/server";

import { getThumbnailResponse } from "../utils";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id?: string } }
) {
  return getThumbnailResponse(params.id ?? null);
}

