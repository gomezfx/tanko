import Image from "next/image"
import { redirect } from "next/navigation"

import { Card } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

export default async function HomePage() {
  const userCount = await prisma.user.count()

  if (userCount === 0) {
    redirect("/setup")
  }

  const volumes = await prisma.volume.findMany({
    orderBy: { title: "asc" },
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-20">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
            <p className="text-sm text-muted-foreground">{volumes.length} titles</p>
          </div>
          {volumes.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">No manga found. Try scanning the library.</Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {volumes.map((volume) => (
                <Card key={volume.id} className="overflow-hidden">
                  <div className="relative aspect-[2/3] w-full bg-muted">
                    {volume.thumbnailPath ? (
                      <Image
                        src={`/api/thumbnail/${volume.id}`}
                        alt={volume.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1280px) 200px, (min-width: 768px) 160px, 50vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <h3 className="line-clamp-2 text-sm font-medium leading-tight">{volume.title}</h3>
                    {volume.author && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{volume.author}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
