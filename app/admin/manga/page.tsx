import Link from "next/link";

import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MangaPage() {
  const volumes = await prisma.volume.findMany({
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Manga</h1>
        <p className="text-muted-foreground">All indexed manga volumes.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {volumes.map((v) => (
          <Link key={v.id} href={`/admin/manga/${v.id}`}>
            <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <div className="aspect-[2/3] w-full bg-muted">
                {v.thumbnailPath ? (
                  <img
                    src={`/api/thumbnail?id=${v.id}`}
                    alt={v.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No thumbnail
                  </div>
                )}
              </div>
              <CardContent className="p-2">
                <div className="truncate text-sm font-medium">{v.title}</div>
                {v.author && (
                  <div className="truncate text-xs text-muted-foreground">{v.author}</div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
