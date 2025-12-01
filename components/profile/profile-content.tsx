"use client"

import { useEffect } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AvatarUploader from "@/components/profile/avatar-uploader"
import type { CurrentUser } from "@/hooks/use-current-user"
import { useCurrentUser } from "@/hooks/use-current-user"

type Props = {
  initialUser: CurrentUser
}

export function ProfileContent({ initialUser }: Props) {
  const { user, setUser, refresh } = useCurrentUser()

  useEffect(() => {
    setUser((previous) => previous ?? initialUser)
  }, [initialUser, setUser])

  const activeUser = user ?? initialUser

  return (
    <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
      <div className="space-y-4">
        <div className="flex flex-col items-start gap-4 rounded-lg border p-4">
          <Avatar className="h-24 w-24">
            {activeUser.avatarUrl ? <AvatarImage src={activeUser.avatarUrl} alt={activeUser.username} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary">
              {activeUser.username.slice(0, 1).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="text-base font-medium text-foreground">Avatar best practices</p>
            <ul className="space-y-1 pl-4">
              <li className="list-disc">Allowed types: JPG, PNG, WEBP</li>
              <li className="list-disc">Recommended size: At least 512×512 pixels, square images work best</li>
              <li className="list-disc">Maximum file size: Up to 5 MB</li>
            </ul>
          </div>
        </div>
      </div>
      <AvatarUploader
        user={activeUser}
        onAvatarSaved={(avatarUrl) => {
          setUser((previous) =>
            previous
              ? { ...previous, avatarUrl }
              : { ...activeUser, avatarUrl },
          )
          void refresh()
        }}
      />
    </div>
  )
}

export default ProfileContent
