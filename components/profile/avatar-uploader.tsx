"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ChangeEventHandler } from "react"
import Cropper, { type Area } from "react-easy-crop"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCurrentUser } from "@/hooks/use-current-user"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

async function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })
}

async function getCroppedBlob(imageSrc: string, croppedAreaPixels: Area) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Unable to prepare canvas context.")
  }

  canvas.width = 512
  canvas.height = 512

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create avatar image."))
          return
        }
        resolve(blob)
      },
      "image/jpeg",
      0.9,
    )
  })
}

type AvatarUploaderProps = {
  initialAvatarUrl?: string | null
  username: string
}

export default function AvatarUploader({ initialAvatarUrl, username }: AvatarUploaderProps) {
  const { user, refresh, setUser } = useCurrentUser()
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl ?? user?.avatarUrl ?? null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setPreviewUrl(user?.avatarUrl ?? initialAvatarUrl ?? null)
  }, [initialAvatarUrl, user?.avatarUrl])

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl)
      }
    }
  }, [fileUrl])

  const onCropComplete = useCallback((_croppedArea: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WEBP image.")
      event.target.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Please choose an image up to 5 MB in size.")
      event.target.value = ""
      return
    }

    setError(null)

    if (fileUrl) {
      URL.revokeObjectURL(fileUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setFileUrl(objectUrl)
    setSelectedFile(file)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setFileUrl(null)
    setCroppedAreaPixels(null)
    setError(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!fileUrl || !selectedFile || !croppedAreaPixels) {
      setError("Select and crop an image first.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const blob = await getCroppedBlob(fileUrl, croppedAreaPixels)
      const formData = new FormData()
      formData.append("avatar", blob, "avatar.jpg")

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      const body = (await response.json().catch(() => ({}))) as { avatarUrl?: string; message?: string }

      if (!response.ok || !body.avatarUrl) {
        throw new Error(body.message || "Unable to save avatar.")
      }

      setPreviewUrl(body.avatarUrl)
      setUser((current) => (current ? { ...current, avatarUrl: body.avatarUrl } : current))
      await refresh()
      handleCancel()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Unable to save avatar.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-16 w-16">
          {previewUrl ? <AvatarImage src={previewUrl} alt={username} /> : null}
          <AvatarFallback>{username.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-1 text-sm">
          <p className="font-medium">Update avatar</p>
          <p className="text-muted-foreground">Upload and crop a square image.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          aria-label="Choose new avatar"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {fileUrl && (
        <div className="space-y-3">
          <div className="relative h-72 w-full overflow-hidden rounded-md border bg-muted">
            <Cropper
              image={fileUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full"
              aria-label="Zoom"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save avatar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
