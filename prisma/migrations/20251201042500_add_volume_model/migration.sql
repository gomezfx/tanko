-- CreateTable
CREATE TABLE "Volume" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "libraryPathId" INTEGER,
    CONSTRAINT "Volume_libraryPathId_fkey" FOREIGN KEY ("libraryPathId") REFERENCES "LibraryPath"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Volume_filePath_key" ON "Volume"("filePath");
