import { NextRequest } from "next/server";

import { getThumbnailResponse } from "../utils";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id?: string }> }
) {
  const { id } = await context.params;

  return getThumbnailResponse(id ?? null);
}

