import NextImage from "next/image"
import { redirect } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AvatarUploader from "@/components/profile/avatar-uploader"
import { getUserFromCookies } from "@/lib/auth"

type UserProfilePageProps = {
  params: { username: string }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const user = await getUserFromCookies()

  if (!user) {
    redirect("/")
  }

  const fallbackLetter = user.username.slice(0, 1).toUpperCase()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="relative rounded-xl border bg-card shadow-sm">
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
          </div>
        </div>

        <div className="absolute bottom-0 left-6 flex translate-y-1/2 items-end gap-4">
          <div className="relative h-32 w-32">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.username} /> : null}
              <AvatarFallback className="text-lg font-semibold">{fallbackLetter}</AvatarFallback>
            </Avatar>
          </div>
          <div className="pb-3">
            <p className="text-sm text-muted-foreground">Public profile</p>
            <p className="text-sm text-foreground/80">Avatar appears across Tanko.</p>
          </div>
        </div>
      </div>

      <div className="mt-20 grid gap-8 md:grid-cols-[1fr,1.1fr]">
        <div className="space-y-4 rounded-md border p-4 md:col-start-2">
          <div>
            <h2 className="text-lg font-medium">Update avatar</h2>
            <p className="text-sm text-muted-foreground">Use a clear image; updates appear across Tanko.</p>
          </div>
          <AvatarUploader initialAvatarUrl={user.avatarUrl ?? null} username={user.username} />
        </div>
      </div>
    </div>
  )
}
