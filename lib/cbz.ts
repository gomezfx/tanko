import path from "node:path"

import AdmZip from "@/vendor/adm-zip"

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"])

function getImageEntries(cbzPath: string) {
  const zip = new AdmZip(cbzPath)
  return zip
    .getEntries()
    .filter((entry) => !entry.isDirectory && IMAGE_EXTENSIONS.has(path.extname(entry.entryName).toLowerCase()))
    .sort((a, b) => a.entryName.localeCompare(b.entryName))
}

export function listCbzImageEntries(cbzPath: string) {
  return getImageEntries(cbzPath).map((entry) => entry.entryName)
}

export function getCbzImagePage(cbzPath: string, pageIndex: number) {
  const entries = getImageEntries(cbzPath)

  if (pageIndex < 0 || pageIndex >= entries.length) {
    throw new Error("Page out of range")
  }

  const entry = entries[pageIndex]
  const data = entry.getData()

  const ext = path.extname(entry.entryName).toLowerCase()
  const mimeType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg"

  return { data, mimeType }
}
