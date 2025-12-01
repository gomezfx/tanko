import type { ReactNode } from "react"

import Navbar from "@/components/navbar"

export default function SiteLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">{children}</main>
    </div>
  )
}
