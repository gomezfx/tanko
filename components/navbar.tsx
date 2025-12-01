"use client"

import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CurrentUser } from "@/hooks/use-current-user"
import { useCurrentUser } from "@/hooks/use-current-user"

function LoginDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (user: CurrentUser) => void
}) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message = typeof body.message === "string" ? body.message : "Invalid username or password."
        setError(message)
        return
      }

      const body = (await response.json()) as { id: number; username: string; role: string }
      onSuccess(body)
      onOpenChange(false)
      setUsername("")
      setPassword("")
    } catch (err) {
      console.error(err)
      setError("Unable to log in. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log in</DialogTitle>
          <DialogDescription>Sign in to access your library.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Log in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function Navbar() {
  const { user, refresh, setUser } = useCurrentUser()
  const [loginOpen, setLoginOpen] = useState(false)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    await refresh()
  }

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="text-lg font-semibold">Tanko</div>
        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Button variant="ghost">Sign up</Button>
              <Button onClick={() => setLoginOpen(true)}>Log in</Button>
            </>
          )}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-10 w-10">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.username.slice(0, 1).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => (window.location.href = "/profile")}>
                  <span className="font-semibold">{user.username}</span>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => (window.location.href = "/admin")}>Admin</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser)
          void refresh()
        }}
      />
    </header>
  )
}

export default Navbar
