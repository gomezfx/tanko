"use client"

import { useMemo, useState } from "react"
import NextImage from "next/image"
import { Camera, Pencil } from "lucide-react"

import AvatarUploader from "@/components/profile/avatar-uploader"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type ProfilePageContentProps = {
  user: {
    username: string
    avatarUrl: string | null
  }
}

export default function ProfilePageContent({ user }: ProfilePageContentProps) {
  const [editMode, setEditMode] = useState(false)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)

  const fallbackLetter = useMemo(() => user.username.slice(0, 1).toUpperCase(), [user.username])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="relative rounded-xl border bg-card shadow-sm pb-20">
        <div className="relative h-48 overflow-hidden rounded-t-xl bg-muted">
          <NextImage
            src="/header-placeholder.svg"
            alt="Profile header"
            fill
            className="object-cover"
            style={{ objectFit: "cover" }}
            sizes="(min-width: 768px) 1000px, 100vw"
            priority
          />
          <div className="absolute inset-x-6 top-4 flex items-center justify-between">
            <div className="drop-shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Profile</p>
              <h1 className="text-2xl font-semibold text-foreground">{user.username}</h1>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setEditMode((prev) => !prev)}>
              <Pencil className="mr-2 h-4 w-4" />
              {editMode ? "Done" : "Edit Profile"}
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 left-6 flex translate-y-1/2 items-end gap-4">
          <div className="relative h-32 w-32">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.username} /> : null}
              <AvatarFallback className="text-lg font-semibold">{fallbackLetter}</AvatarFallback>
            </Avatar>
            {editMode && (
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/60"
                aria-label="Edit avatar"
              >
                <Camera className="h-7 w-7" />
              </button>
            )}
          </div>
          <div className="pb-3">
            <p className="text-sm text-muted-foreground">Public profile</p>
            <p className="text-sm text-foreground/80">Avatar appears across Tanko.</p>
          </div>
        </div>
      </div>

      <div className="mt-20 flex justify-end">
        <div className="space-y-3 rounded-md border p-4 md:w-2/3">
          <h2 className="text-lg font-medium">Profile editing</h2>
          <p className="text-sm text-muted-foreground">
            Toggle Edit Profile to update your avatar. Click the overlaid avatar to launch the uploader modal.
          </p>
        </div>
      </div>

      <Dialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update avatar</DialogTitle>
          </DialogHeader>
          <AvatarUploader initialAvatarUrl={user.avatarUrl ?? null} username={user.username} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
