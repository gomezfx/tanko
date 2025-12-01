"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

type DialogContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used within <Dialog />")
  }
  return context
}

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...props }, ref) => {
    const { onOpenChange } = useDialogContext()

    return (
      <button
        type="button"
        ref={ref}
        onClick={(event) => {
          props.onClick?.(event)
          onOpenChange(true)
        }}
        {...props}
      >
        {children}
      </button>
    )
  },
)
DialogTrigger.displayName = "DialogTrigger"

const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("fixed inset-0 z-40 bg-black/50 backdrop-blur-sm", className)}
      {...props}
    />
  )
})
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useDialogContext()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
      setMounted(true)
    }, [])

    React.useEffect(() => {
      if (!open) return

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onOpenChange(false)
        }
      }

      window.addEventListener("keydown", onKeyDown)
      return () => window.removeEventListener("keydown", onKeyDown)
    }, [onOpenChange, open])

    if (!open || !mounted) return null

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <DialogOverlay onClick={() => onOpenChange(false)} />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg",
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
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 space-y-1", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)
DialogDescription.displayName = "DialogDescription"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

type DialogCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ children, asChild = false, ...props }, ref) => {
    const { onOpenChange } = useDialogContext()

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          if (typeof children.props.onClick === "function") {
            children.props.onClick(event)
          }
          props.onClick?.(event)
          onOpenChange(false)
        },
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={(event) => {
          props.onClick?.(event)
          onOpenChange(false)
        }}
        {...props}
      >
        {children}
      </button>
    )
  },
)
DialogClose.displayName = "DialogClose"

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
}
