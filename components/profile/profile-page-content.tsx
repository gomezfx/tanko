"use client"

import { useEffect, useMemo, useState } from "react"
import NextImage from "next/image"
import { Camera, Pencil, X } from "lucide-react"
import { useRouter } from "next/navigation"

import AvatarUploader from "@/components/profile/avatar-uploader"
import ProfileHeaderUploader from "@/components/profile/profile-header-uploader"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type ProfilePageContentProps = {
  user: {
    username: string
    avatarUrl: string | null
    headerUrl: string | null
  }
}

export default function ProfilePageContent({ user }: ProfilePageContentProps) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [headerModalOpen, setHeaderModalOpen] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(user.avatarUrl ?? null)
  const [currentHeader, setCurrentHeader] = useState<string | null>(user.headerUrl ?? null)

  const fallbackLetter = useMemo(() => user.username.slice(0, 1).toUpperCase(), [user.username])
  const headerImage = currentHeader ?? "/header-placeholder.svg"

  useEffect(() => {
    setCurrentAvatar(user.avatarUrl ?? null)
    setCurrentHeader(user.headerUrl ?? null)
  }, [user.avatarUrl, user.headerUrl])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="relative rounded-xl border bg-card shadow-sm pb-20">
        <div className="relative h-48 overflow-hidden rounded-t-xl bg-muted">
          <NextImage
            src={headerImage}
            alt="Profile header"
            fill
            className="object-cover"
            style={{ objectFit: "cover" }}
            sizes="(min-width: 768px) 1000px, 100vw"
            priority
          />
          {editMode && (
            <button
              type="button"
              onClick={() => setHeaderModalOpen(true)}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
              aria-label="Edit profile header"
            >
              <span className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-sm font-medium shadow">
                <Camera className="h-4 w-4" />
                Change header
              </span>
            </button>
          )}
          <div className="absolute inset-x-6 top-4 z-20 flex items-center justify-between">
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
              {currentAvatar ? <AvatarImage src={currentAvatar} alt={user.username} /> : null}
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
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          <DialogHeader>
            <DialogTitle>Update avatar</DialogTitle>
          </DialogHeader>
          <AvatarUploader
            initialAvatarUrl={user.avatarUrl ?? null}
            username={user.username}
            onUploadComplete={(url) => {
              setCurrentAvatar(url)
              setAvatarModalOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={headerModalOpen} onOpenChange={setHeaderModalOpen}>
        <DialogContent>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          <DialogHeader>
            <DialogTitle>Update profile header</DialogTitle>
          </DialogHeader>
          <ProfileHeaderUploader
            initialHeaderUrl={user.headerUrl ?? null}
            onUploadComplete={(url) => {
              setCurrentHeader(url)
              setHeaderModalOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
