import path from "path"
import { promises as fs } from "fs"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getDefaultRoot() {
  if (process.platform === "win32") {
    const systemDrive = process.env.SystemDrive || "C:";
    return path.join(systemDrive, path.sep);
  }

  return path.sep;
}

async function getParentPath(resolvedPath: string) {
  const parsed = path.parse(resolvedPath);

  if (resolvedPath === parsed.root) {
    return null;
  }

  return path.dirname(resolvedPath);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedPath = searchParams.get("path") || getDefaultRoot();
    const resolvedPath = path.resolve(requestedPath);

    const stats = await fs.stat(resolvedPath);

    if (!stats.isDirectory()) {
      return NextResponse.json({ message: "Path is not a directory." }, { status: 400 });
    }

    const dirents = await fs.readdir(resolvedPath);
    const directories: Array<{ name: string; fullPath: string }> = [];

    for (const entry of dirents) {
      const fullPath = path.join(resolvedPath, entry);
      try {
        const entryStats = await fs.stat(fullPath);
        if (entryStats.isDirectory()) {
          directories.push({ name: entry, fullPath });
        }
      } catch (error) {
        console.warn(`Unable to stat ${fullPath}:`, error);
      }
    }

    const parent = await getParentPath(resolvedPath);

    return NextResponse.json({ path: resolvedPath, parent, directories });
  } catch (error) {
    console.error("Failed to list directories:", error);
    return NextResponse.json(
      { message: "Unable to access the requested path." },
      { status: 400 },
    );
  }
}
