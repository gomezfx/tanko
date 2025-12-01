import { redirect } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AvatarUploader from "@/components/profile/avatar-uploader"
import { getUserFromCookies } from "@/lib/auth"

export default async function ProfilePage() {
  const user = await getUserFromCookies()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">Manage your Tanko account.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[auto,1fr]">
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-32 w-32">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.username} /> : null}
            <AvatarFallback className="text-lg font-semibold">
              {user.username.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">Current avatar</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <h2 className="text-lg font-medium">Avatar best practices</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Allowed types: JPG, PNG, WEBP</li>
              <li>Recommended size: At least 512×512 pixels, square image works best</li>
              <li>Max file size: Up to 5 MB</li>
            </ul>
          </div>

          <AvatarUploader initialAvatarUrl={user.avatarUrl ?? null} username={user.username} />
        </div>
      </div>
    </div>
  )
}
