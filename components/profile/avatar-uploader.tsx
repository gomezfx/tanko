"use client"

import NextImage from "next/image"
import { useCallback, useEffect, useRef, useState, type ChangeEventHandler } from "react"
import Cropper from "react-easy-crop"

import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MIN_DIMENSION = 128
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MIN_ZOOM = 1
const MAX_ZOOM = 6

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

  canvas.width = croppedAreaPixels.width
  canvas.height = croppedAreaPixels.height

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
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
      0.95,
    )
  })
}

type AvatarUploaderProps = {
  initialAvatarUrl?: string | null
  username: string
  onUploadComplete?: () => void
}

export default function AvatarUploader({ initialAvatarUrl, username, onUploadComplete }: AvatarUploaderProps) {
  const { user, refresh, setUser } = useCurrentUser()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? user?.avatarUrl ?? null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [showCropper, setShowCropper] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl ?? initialAvatarUrl ?? null)
  }, [initialAvatarUrl, user?.avatarUrl])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl)
      }
    }
  }, [previewImageUrl])

  useEffect(() => {
    if (!previewUrl || !croppedAreaPixels) {
      setPreviewImageUrl(null)
      return
    }

    let canceled = false

    const generatePreview = async () => {
      try {
        const blob = await getCroppedBlob(previewUrl, croppedAreaPixels)
        if (canceled) return
        const url = URL.createObjectURL(blob)
        setPreviewImageUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current)
          }
          return url
        })
      } catch (err) {
        console.error("Error generating preview", err)
      }
    }

    generatePreview()

    return () => {
      canceled = true
    }
  }, [previewUrl, croppedAreaPixels])

  const onCropComplete = useCallback((_croppedArea: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const validateImage = async (file: File) => {
    setValidationError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError("Please select a JPEG, PNG, or WebP image.")
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError("File size must be less than 5 MB.")
      return false
    }

    return new Promise<boolean>((resolve) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const valid = img.width >= MIN_DIMENSION && img.height >= MIN_DIMENSION
        if (!valid) {
          setValidationError("Image must be at least 128x128 pixels.")
        }
        URL.revokeObjectURL(url)
        resolve(valid)
      }
      img.onerror = () => {
        setValidationError("Invalid image file.")
        URL.revokeObjectURL(url)
        resolve(false)
      }
      img.src = url
    })
  }

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isValid = await validateImage(file)
    if (!isValid) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setPreviewImageUrl(null)
      setShowCropper(false)
      setCroppedAreaPixels(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      event.target.value = ""
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(objectUrl)
    setShowCropper(true)
    setCrop({ x: 0, y: 0 })
    setZoom(MIN_ZOOM)
    setCroppedAreaPixels(null)
    setPreviewImageUrl(null)
    setError(null)
    setValidationError(null)
  }

  const handleCancel = () => {
    setShowCropper(false)
    setSelectedFile(null)
    setPreviewUrl(null)
    setPreviewImageUrl(null)
    setCroppedAreaPixels(null)
    setValidationError(null)
    setError(null)
    setZoom(MIN_ZOOM)
    setCrop({ x: 0, y: 0 })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!previewUrl || !croppedAreaPixels) {
      setError("Select and crop an image first.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const blob = await getCroppedBlob(previewUrl, croppedAreaPixels)
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

      setAvatarUrl(body.avatarUrl)
      setUser((current) => (current ? { ...current, avatarUrl: body.avatarUrl } : current))
      await refresh()
      onUploadComplete?.()
      handleCancel()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Unable to save avatar.")
    } finally {
      setIsProcessing(false)
    }
  }

  const displayAvatar = avatarUrl
  const fallbackLetter = username.slice(0, 1).toUpperCase()

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted text-lg font-semibold text-muted-foreground">
            {displayAvatar ? (
              <NextImage src={displayAvatar} alt={username} fill sizes="64px" className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center">{fallbackLetter}</div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Profile Avatar</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP • Max 5MB • Min 128×128px</p>
          </div>
        </div>
        {(previewUrl || avatarUrl) && (
          <Button variant="link" type="button" onClick={handleCancel} className="px-0 text-destructive hover:text-destructive/80">
            Remove
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => fileInputRef.current?.click()}>
            Choose File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpeg,.jpg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Choose new avatar"
          />
          <p className="text-sm text-foreground/80">{selectedFile?.name ?? "No file chosen"}</p>
        </div>
      </div>

      {validationError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {validationError}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {showCropper && previewUrl && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-foreground/80">Crop your image (square aspect ratio)</h3>
            <div className="relative h-64 w-full overflow-hidden rounded-lg border bg-muted">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                showGrid
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-xs text-muted-foreground">Zoom</label>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-primary"
                aria-label="Zoom"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleSave} disabled={isProcessing || !croppedAreaPixels}>
              {isProcessing ? "Processing..." : "Upload Avatar"}
            </Button>
            <Button variant="outline" type="button" onClick={handleCancel} disabled={isProcessing}>
              Cancel
            </Button>
          </div>

          {previewImageUrl && (
            <div className="rounded-md border border-primary/30 bg-primary/10 p-4">
              <h4 className="mb-2 text-sm font-medium text-primary">Preview</h4>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
                  <NextImage src={previewImageUrl} alt="Avatar preview" fill sizes="48px" className="object-cover" unoptimized />
                </div>
                <p className="text-xs text-primary">
                  This is how your avatar will appear (circular display, square storage)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
