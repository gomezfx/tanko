"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type MangaReaderProps = {
  volumeId: number
  title: string
  pageCount: number
}

export default function MangaReader({ volumeId, title, pageCount }: MangaReaderProps) {
  const [open, setOpen] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)

  const hasPages = pageCount > 0
  const pageLabel = useMemo(() => `${pageIndex + 1} / ${pageCount || "?"}`, [pageCount, pageIndex])
  const imageSrc = useMemo(() => `/api/manga/${volumeId}/pages/${pageIndex}`, [pageIndex, volumeId])

  const goPrev = () => setPageIndex((prev) => (prev > 0 ? prev - 1 : prev))
  const goNext = () => setPageIndex((prev) => (prev < pageCount - 1 ? prev + 1 : prev))

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        goPrev()
      } else if (event.key === "ArrowRight") {
        goNext()
      } else if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, pageCount])

  useEffect(() => {
    if (pageIndex >= pageCount && pageCount > 0) {
      setPageIndex(pageCount - 1)
    }
  }, [pageCount, pageIndex])

  return (
    <>
      <div className="flex items-center gap-3">
        <Button onClick={() => setOpen(true)} disabled={!hasPages}>
          Read manga
        </Button>
        {!hasPages && <p className="text-sm text-muted-foreground">No pages available.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="fixed inset-0 m-0 h-screen w-screen max-w-none rounded-none border-none bg-black/90 p-0 text-white shadow-none">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-white/60">Reading</p>
                <p className="text-sm font-medium text-white">{title}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/70">{pageLabel}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setOpen(false)}
                  className="text-white/80 hover:bg-white/10 hover:text-white"
                  aria-label="Close reader"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative flex-1 bg-black overflow-hidden">
              <img
                src={imageSrc}
                alt={`Page ${pageIndex + 1}`}
                className="mx-auto h-full max-h-full w-auto max-w-[min(90vw,1200px)] object-contain select-none"
                draggable={false}
              />

              <button
                type="button"
                onClick={goPrev}
                disabled={pageIndex === 0}
                className="absolute inset-y-0 left-0 w-1/2 cursor-pointer bg-gradient-to-r from-black/40 via-transparent to-transparent text-transparent transition hover:from-black/60 disabled:cursor-not-allowed disabled:from-transparent"
                aria-label="Previous page"
              >
                <ArrowLeft className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-white/70" />
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={pageIndex >= pageCount - 1}
                className="absolute inset-y-0 right-0 w-1/2 cursor-pointer bg-gradient-to-l from-black/40 via-transparent to-transparent text-transparent transition hover:from-black/60 disabled:cursor-not-allowed disabled:from-transparent"
                aria-label="Next page"
              >
                <ArrowRight className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-white/70" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
