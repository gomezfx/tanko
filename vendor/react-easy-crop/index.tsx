/* eslint-disable @next/next/no-img-element */
"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react"

export type Point = { x: number; y: number }
export type Area = { x: number; y: number; width: number; height: number }

export type CropperProps = {
  image: string
  crop: Point
  zoom: number
  aspect?: number
  onCropChange: (location: Point) => void
  onZoomChange: (value: number) => void
  onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void
  restrictPosition?: boolean
}

type Dimensions = { width: number; height: number }

type Layout = {
  displayedWidth: number
  displayedHeight: number
  offsetX: number
  offsetY: number
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
  scale: number
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

function computeLayout(container: Dimensions, image: Dimensions, zoom: number, crop: Point): Layout | null {
  if (!container.width || !container.height || !image.width || !image.height) {
    return null
  }

  const baseScale = Math.max(container.width / image.width, container.height / image.height)
  const scale = baseScale * zoom
  const displayedWidth = image.width * scale
  const displayedHeight = image.height * scale
  const centerOffsetX = (container.width - displayedWidth) / 2
  const centerOffsetY = (container.height - displayedHeight) / 2

  const minX = container.width - displayedWidth - centerOffsetX
  const maxX = -centerOffsetX
  const minY = container.height - displayedHeight - centerOffsetY
  const maxY = -centerOffsetY

  return {
    displayedWidth,
    displayedHeight,
    offsetX: centerOffsetX + crop.x,
    offsetY: centerOffsetY + crop.y,
    bounds: { minX, maxX, minY, maxY },
    scale,
  }
}

function computeCroppedArea(container: Dimensions, image: Dimensions, layout: Layout): Area {
  const inverseScale = 1 / layout.scale
  const cropX = -layout.offsetX * inverseScale
  const cropY = -layout.offsetY * inverseScale
  const cropWidth = container.width * inverseScale
  const cropHeight = container.height * inverseScale

  const x = clamp(cropX, 0, Math.max(0, image.width - cropWidth))
  const y = clamp(cropY, 0, Math.max(0, image.height - cropHeight))
  const width = Math.min(image.width, cropWidth, image.width - x)
  const height = Math.min(image.height, cropHeight, image.height - y)

  return { x, y, width, height }
}

function Cropper({
  image,
  crop,
  zoom,
  aspect,
  onCropChange,
  onZoomChange,
  onCropComplete,
  restrictPosition,
}: CropperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerSize, setContainerSize] = useState<Dimensions>({ width: 0, height: 0 })
  const [imageSize, setImageSize] = useState<Dimensions>({ width: 0, height: 0 })
  const dragState = useRef<{ startX: number; startY: number; cropX: number; cropY: number } | null>(null)

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!image) return

    const img = new Image()
    img.src = image
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
  }, [image])

  const layout = useMemo(() => computeLayout(containerSize, imageSize, zoom, crop), [containerSize, imageSize, zoom, crop])

  useEffect(() => {
    if (!layout || !imageSize.width || !containerSize.width || !onCropComplete) return
    const area = computeCroppedArea(containerSize, imageSize, layout)
    onCropComplete(area, area)
  }, [containerSize, imageSize, layout, onCropComplete])

  const applyCrop = useCallback(
    (nextX: number, nextY: number) => {
      if (!layout) return

      const clampedX = restrictPosition === false ? nextX : clamp(nextX, layout.bounds.minX, layout.bounds.maxX)
      const clampedY = restrictPosition === false ? nextY : clamp(nextY, layout.bounds.minY, layout.bounds.maxY)
      onCropChange({ x: clampedX, y: clampedY })
    },
    [layout, onCropChange, restrictPosition],
  )

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState.current) return
      const deltaX = event.clientX - dragState.current.startX
      const deltaY = event.clientY - dragState.current.startY
      applyCrop(dragState.current.cropX + deltaX, dragState.current.cropY + deltaY)
    }

    const handlePointerUp = () => {
      dragState.current = null
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [applyCrop])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!layout) return
    event.preventDefault()
    dragState.current = { startX: event.clientX, startY: event.clientY, cropX: crop.x, cropY: crop.y }
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const delta = event.deltaY < 0 ? 0.05 : -0.05
    const nextZoom = clamp(zoom + delta, 1, 3)
    onZoomChange(nextZoom)
  }

  const display = useMemo(() => {
    if (!layout) return null
    return {
      width: layout.displayedWidth,
      height: layout.displayedHeight,
      left: layout.offsetX,
      top: layout.offsetY,
    }
  }, [layout])

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "none",
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
    >
      {display && (
        <img
          src={image}
          alt="Crop"
          style={{
            position: "absolute",
            left: display.left,
            top: display.top,
            width: display.width,
            height: display.height,
            userSelect: "none",
            pointerEvents: "none",
            objectFit: "cover",
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          border: "2px solid rgba(255,255,255,0.7)",
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
          pointerEvents: "none",
          aspectRatio: aspect || 1,
        }}
      />
    </div>
  )
}

export default Cropper
