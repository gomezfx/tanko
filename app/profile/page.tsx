import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import Navbar from "@/components/navbar"
import { ProfileContent } from "@/components/profile/profile-content"
import { SESSION_COOKIE_NAME, clearSession } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) {
    return null
  }

  if (session.expiresAt < new Date()) {
    await clearSession(token)
    return null
  }

  return session.user
}

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-20">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
            <p className="text-sm text-muted-foreground">Update your personal settings and avatar.</p>
          </div>
          <ProfileContent
            initialUser={{
              id: user.id,
              username: user.username,
              role: user.role,
              avatarUrl: user.avatarUrl ?? null,
            }}
          />
        </div>
      </main>
    </div>
  )
}
