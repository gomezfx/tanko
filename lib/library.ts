import { promises as fs } from "fs";
import path from "path";

import AdmZip from "@/vendor/adm-zip";
import sharp from "sharp";

import prisma from "./prisma";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function collectCbzFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await collectCbzFiles(fullPath);
      files.push(...nestedFiles);
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".cbz") {
      files.push(fullPath);
    }
  }

  return files;
}

async function ensureThumbnailDirectory(): Promise<string> {
  const thumbnailsPath = path.join(process.cwd(), "thumbnails");
  await fs.mkdir(thumbnailsPath, { recursive: true });
  return thumbnailsPath;
}

export async function generateThumbnailFromCbz(cbzPath: string): Promise<string> {
  const zip = new AdmZip(cbzPath);
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory);

  const imageEntry = entries
    .sort((a, b) => a.entryName.localeCompare(b.entryName))
    .find((entry) => IMAGE_EXTENSIONS.has(path.extname(entry.entryName).toLowerCase()));

  if (!imageEntry) {
    throw new Error(`No image entries found in ${cbzPath}`);
  }

  const imageData = imageEntry.getData();
  const thumbnailsDir = await ensureThumbnailDirectory();
  const baseName = path.basename(cbzPath, path.extname(cbzPath));
  const thumbnailPath = path.join(thumbnailsDir, `${baseName}.jpg`);

  await sharp(imageData)
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  return thumbnailPath;
}

export type ScanResult = {
  found: number;
  created: number;
  updatedThumbs: number;
};

export async function scanLibrary(): Promise<ScanResult> {
  if (!(prisma as unknown as { volume?: unknown }).volume) {
    throw new Error(
      "Prisma client is missing the Volume model. Run `npm run prisma:sync` to regenerate the client."
    );
  }

  const libraryPaths = await prisma.libraryPath.findMany();
  const result: ScanResult = { found: 0, created: 0, updatedThumbs: 0 };

  for (const libraryPath of libraryPaths) {
    const resolvedPath = path.resolve(libraryPath.path);
    const cbzFiles = await collectCbzFiles(resolvedPath);

    result.found += cbzFiles.length;

    for (const cbzFile of cbzFiles) {
      const title = path.basename(cbzFile, path.extname(cbzFile));
      const thumbnailPath = await generateThumbnailFromCbz(cbzFile).catch((error) => {
        console.error(`Failed to generate thumbnail for ${cbzFile}:`, error);
        return null;
      });

      if (!thumbnailPath) {
        continue;
      }

      const upsertedVolume = await prisma.volume.upsert({
        where: { filePath: cbzFile },
        create: {
          title,
          filePath: cbzFile,
          thumbnailPath,
          libraryPathId: libraryPath.id,
        },
        update: {
          title,
          thumbnailPath,
          libraryPathId: libraryPath.id,
        },
      });

      if (upsertedVolume.createdAt.getTime() === upsertedVolume.updatedAt.getTime()) {
        result.created += 1;
      } else {
        result.updatedThumbs += 1;
      }
    }
  }

  return result;
}
