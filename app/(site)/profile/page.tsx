import { redirect } from "next/navigation"

import { getUserFromCookies } from "@/lib/auth"

export default async function ProfileRedirectPage() {
  const user = await getUserFromCookies()

  if (!user) {
    redirect("/")
  }

  redirect(`/users/${user.username}`)
}
