"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"

type Props = {
  user: CurrentUser
  onAvatarSaved?: (avatarUrl: string) => void
}

type Point = { x: number; y: number }

type Dimensions = { width: number; height: number }

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const OUTPUT_SIZE = 512

export function AvatarUploader({ user, onAvatarSaved }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [imageDimensions, setImageDimensions] = useState<Dimensions | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatarUrl ?? null)
  const [containerSize, setContainerSize] = useState(320)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dragState = useRef<{ start: Point; initial: Point } | null>(null)

  useEffect(() => {
    setPreviewUrl(user.avatarUrl ?? null)
  }, [user.avatarUrl])

  useEffect(() => {
    const element = containerRef.current

    if (!element) return

    const resizeObserver = new ResizeObserver(() => {
      setContainerSize(Math.min(element.clientWidth, element.clientHeight))
    })

    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [])

  const baseScale = useMemo(() => {
    if (!imageDimensions || !containerSize) return 1
    const widthScale = containerSize / imageDimensions.width
    const heightScale = containerSize / imageDimensions.height
    return Math.max(widthScale, heightScale)
  }, [containerSize, imageDimensions])

  const displayedSize = useMemo(() => {
    if (!imageDimensions) return { width: 0, height: 0 }
    const width = imageDimensions.width * baseScale * zoom
    const height = imageDimensions.height * baseScale * zoom
    return { width, height }
  }, [baseScale, imageDimensions, zoom])

  const clampCrop = useCallback(
    (nextCrop: Point) => {
      const maxX = Math.max(0, (displayedSize.width - containerSize) / 2)
      const maxY = Math.max(0, (displayedSize.height - containerSize) / 2)

      return {
        x: Math.min(Math.max(nextCrop.x, -maxX), maxX),
        y: Math.min(Math.max(nextCrop.y, -maxY), maxY),
      }
    },
    [containerSize, displayedSize.height, displayedSize.width],
  )

  useEffect(() => {
    setCrop((current) => clampCrop(current))
  }, [clampCrop])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError(null)

    if (!file) {
      return
    }

    const normalizedType = (file.type || "").toLowerCase()

    if (!ALLOWED_TYPES.includes(normalizedType)) {
      setError("Unsupported file type. Please choose JPG, PNG, or WEBP.")
      event.target.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 5 MB.")
      event.target.value = ""
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        setSelectedImage(result)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
      }
    }

    reader.onerror = () => {
      setError("Unable to read the selected file.")
    }

    reader.readAsDataURL(file)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedImage) return

    event.preventDefault()
    dragState.current = {
      start: { x: event.clientX, y: event.clientY },
      initial: crop,
    }
  }

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragState.current) return
      event.preventDefault()
      const deltaX = event.clientX - dragState.current.start.x
      const deltaY = event.clientY - dragState.current.start.y
      const nextCrop = clampCrop({
        x: dragState.current.initial.x + deltaX,
        y: dragState.current.initial.y + deltaY,
      })
      setCrop(nextCrop)
    },
    [clampCrop],
  )

  const handlePointerUp = useCallback(() => {
    dragState.current = null
  }, [])

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  const drawCroppedImage = async () => {
    if (!selectedImage || !imageRef.current || !imageDimensions) return null

    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) return null

    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE

    const image = imageRef.current
    const displayWidth = displayedSize.width
    const displayHeight = displayedSize.height

    const offsetX = (containerSize - displayWidth) / 2 + crop.x
    const offsetY = (containerSize - displayHeight) / 2 + crop.y

    const sourceX = Math.max(0, (-offsetX / displayWidth) * imageDimensions.width)
    const sourceY = Math.max(0, (-offsetY / displayHeight) * imageDimensions.height)
    const sourceWidth = Math.min(
      imageDimensions.width,
      (containerSize / displayWidth) * imageDimensions.width,
    )
    const sourceHeight = Math.min(
      imageDimensions.height,
      (containerSize / displayHeight) * imageDimensions.height,
    )

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92)
    })
  }

  const handleSave = async () => {
    if (!selectedImage || !imageDimensions) {
      setError("Select an image to continue.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const blob = await drawCroppedImage()

      if (!blob) {
        throw new Error("Unable to process the image.")
      }

      const formData = new FormData()
      formData.append("avatar", blob, "avatar.jpg")

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message = typeof body.message === "string" ? body.message : "Upload failed."
        throw new Error(message)
      }

      const body = (await response.json()) as { avatarUrl: string }
      setPreviewUrl(body.avatarUrl)
      setSelectedImage(null)
      setZoom(1)
      setCrop({ x: 0, y: 0 })
      if (inputRef.current) {
        inputRef.current.value = ""
      }

      onAvatarSaved?.(body.avatarUrl)
    } catch (uploadError) {
      console.error(uploadError)
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedImage(null)
    setError(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Avatar</Label>
        <p className="text-sm text-muted-foreground">Upload and crop a square image to represent your profile.</p>
      </div>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {previewUrl ? <AvatarImage src={previewUrl} alt={user.username} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary">
            {user.username.slice(0, 1).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <p className="mt-2 text-xs text-muted-foreground">Accepted formats: JPG, PNG, WEBP. Max size 5 MB.</p>
        </div>
      </div>

      {selectedImage && (
        <div className="space-y-4">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            className={cn("relative aspect-square w-full max-w-xl overflow-hidden rounded-lg border bg-muted", "select-none")}
            style={{ touchAction: "none", cursor: dragState.current ? "grabbing" : "grab" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Avatar crop"
              onLoad={(event) => {
                const target = event.currentTarget
                setImageDimensions({ width: target.naturalWidth, height: target.naturalHeight })
              }}
              draggable={false}
              className="absolute left-1/2 top-1/2 h-auto w-auto select-none"
              style={{
                width: imageDimensions ? imageDimensions.width * baseScale : undefined,
                height: imageDimensions ? imageDimensions.height * baseScale : undefined,
                transform: `translate(-50%, -50%) translate(${crop.x}px, ${crop.y}px) scale(${zoom})`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-primary/70" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="zoom">Zoom</Label>
            <input
              id="zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save avatar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AvatarUploader
