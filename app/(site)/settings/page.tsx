import { redirect } from "next/navigation"

import { getUserFromCookies } from "@/lib/auth"

export default async function SettingsPage() {
  const user = await getUserFromCookies()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences.</p>
      </div>

      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        More settings are on the way. For now, use your profile to update your avatar.
      </div>
    </div>
  )
}
