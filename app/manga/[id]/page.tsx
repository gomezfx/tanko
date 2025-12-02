import NextImage from "next/image"
import { notFound } from "next/navigation"

import { listCbzImageEntries } from "@/lib/cbz"
import prisma from "@/lib/prisma"
import MangaReader from "@/components/manga/manga-reader"

type MangaDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function MangaDetailPage({ params }: MangaDetailPageProps) {
  const { id: idParam } = await params

  const id = Number.parseInt(idParam, 10)

  if (Number.isNaN(id)) {
    notFound()
  }

  const volume = await prisma.volume.findUnique({
    where: { id },
  })

  if (!volume) {
    notFound()
  }

  let pageCount = 0

  try {
    pageCount = listCbzImageEntries(volume.filePath).length
  } catch (error) {
    console.error("Failed to read manga pages", error)
  }

  const hasThumbnail = Boolean(volume.thumbnailPath)
  const coverSrc = hasThumbnail ? `/api/thumbnail/${volume.id}` : "/file.svg"

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="relative h-[320px] w-[220px] overflow-hidden rounded-lg border bg-muted">
          <NextImage
            src={coverSrc}
            alt={hasThumbnail ? volume.title ?? "Manga cover" : "Manga cover placeholder"}
            fill
            sizes="220px"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Manga ID</p>
            <h1 className="text-3xl font-semibold text-foreground">#{id}</h1>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Title</dt>
                <dd className="text-base text-foreground">Title placeholder</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Author</dt>
                <dd className="text-base text-foreground">Author placeholder</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Publish date</dt>
                <dd className="text-base text-foreground">Publish date placeholder</dd>
              </div>
            </dl>
          </div>

          <MangaReader volumeId={volume.id} title={volume.title} pageCount={pageCount} />
        </div>
      </div>
    </div>
  )
}
