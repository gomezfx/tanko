"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

type DropdownContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null)

function useDropdownContext() {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error("DropdownMenu components must be used within DropdownMenu")
  return context
}

type DropdownMenuProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function DropdownMenu({ open: openProp, onOpenChange, children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(Boolean(openProp))
  const triggerRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    if (openProp === undefined) return
    setOpen(openProp)
  }, [openProp])

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
  }

  return <DropdownContext.Provider value={{ open, setOpen: handleOpenChange, triggerRef }}>{children}</DropdownContext.Provider>
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...props }, ref) => {
    const { setOpen, triggerRef, open } = useDropdownContext()

    return (
      <button
        type="button"
        ref={(node) => {
          triggerRef.current = node as HTMLElement | null
          if (typeof ref === "function") {
            ref(node as HTMLButtonElement)
          } else if (ref) {
            ;(ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
          }
        }}
        onClick={(event) => {
          props.onClick?.(event)
          setOpen(!open)
        }}
        {...props}
      >
        {children}
      </button>
    )
  },
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useDropdownContext()
    const [mounted, setMounted] = React.useState(false)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const [position, setPosition] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 })

    React.useEffect(() => {
      setMounted(true)
    }, [])

    React.useEffect(() => {
      if (!open) return

      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) {
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.right + window.scrollX,
        })
      }

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false)
      }

      const onClickOutside = (event: MouseEvent) => {
        if (!triggerRef.current) return
        if (triggerRef.current.contains(event.target as Node)) return
        if (contentRef.current && contentRef.current.contains(event.target as Node)) return
        setOpen(false)
      }

      window.addEventListener("keydown", onKeyDown)
      window.addEventListener("mousedown", onClickOutside)
      return () => {
        window.removeEventListener("keydown", onKeyDown)
        window.removeEventListener("mousedown", onClickOutside)
      }
    }, [open, setOpen, triggerRef])

    if (!open || !mounted) return null

    return createPortal(
      <div className="fixed z-50" style={{ top: position.top, left: position.left, transform: "translateX(-100%)" }}>
        <div
          ref={(node) => {
            contentRef.current = node
            if (typeof ref === "function") {
              ref(node)
            } else if (ref) {
              ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
            }
          }}
          className={cn(
            "absolute right-0 mt-2 min-w-[12rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </div>,
      document.body,
    )
  },
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { setOpen } = useDropdownContext()

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex w-full items-center justify-start rounded-sm px-3 py-2 text-sm text-left hover:bg-muted",
          className,
        )}
        onClick={(event) => {
          props.onClick?.(event)
          setOpen(false)
        }}
        {...props}
      >
        {children}
      </button>
    )
  },
)
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger }
