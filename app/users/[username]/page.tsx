import { redirect } from "next/navigation"

import ProfilePageContent from "@/components/profile/profile-page-content"
import { getUserFromCookies } from "@/lib/auth"

type UserProfilePageProps = {
  params: { username: string }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const user = await getUserFromCookies()

  if (!user) {
    redirect("/")
  }

  return <ProfilePageContent user={user} />
}
