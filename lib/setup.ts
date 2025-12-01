import { promises as fs } from "fs"

import type { PrismaClient } from "@prisma/client"

export class ValidationError extends Error {}

export async function validateLibraryPaths(paths: unknown): Promise<string[]> {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new ValidationError("paths must be a non-empty array.")
  }

  const validatedPaths: string[] = []

  for (const rawPath of paths) {
    const trimmedPath = String(rawPath ?? "").trim()

    if (!trimmedPath) {
      throw new ValidationError("Path cannot be empty.")
    }

    try {
      const stats = await fs.stat(trimmedPath)

      if (!stats.isDirectory()) {
        throw new ValidationError(`${trimmedPath} is not a directory.`)
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }

      throw new ValidationError(`${trimmedPath} does not exist on the filesystem.`)
    }

    validatedPaths.push(trimmedPath)
  }

  return Array.from(new Set(validatedPaths))
}

type LibraryPathClient = PrismaClient["libraryPath"]

export function requireLibraryPathClient(prisma: PrismaClient): LibraryPathClient {
  const libraryPathClient = (prisma as PrismaClient & { libraryPath?: LibraryPathClient }).libraryPath

  if (!libraryPathClient) {
    throw new ValidationError(
      "LibraryPath model is missing from the Prisma client. Run `prisma generate` to update the client after schema changes.",
    )
  }

  return libraryPathClient
}
