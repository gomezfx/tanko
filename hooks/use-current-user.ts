"use client"

import { useCallback, useEffect, useState } from "react"

export type CurrentUser = {
  id: number
  username: string
  role: string
  avatarUrl?: string | null
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" })

      if (!response.ok) {
        if (response.status !== 401) {
          setError("Unable to load user data.")
        } else {
          setError(null)
        }
        setUser(null)
      } else {
        const body = (await response.json()) as CurrentUser
        setUser(body)
        setError(null)
      }
    } catch (err) {
      console.error(err)
      setError("Unable to load user data.")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  return {
    user,
    loading,
    error,
    refresh: fetchUser,
    setUser,
  }
}
