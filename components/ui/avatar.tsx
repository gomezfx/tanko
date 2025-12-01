/* eslint-disable @next/next/no-img-element */
import * as React from "react"

import { cn } from "@/lib/utils"

type AvatarProps = React.HTMLAttributes<HTMLDivElement>

type AvatarImageProps = React.ImgHTMLAttributes<HTMLImageElement>

type AvatarFallbackProps = React.HTMLAttributes<HTMLDivElement>

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(({ className, alt, ...props }, ref) => {
  return <img ref={ref} alt={alt ?? ""} className={cn("h-full w-full object-cover", className)} {...props} />
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center bg-muted", className)}
      {...props}
    >
      {children}
    </div>
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback, AvatarImage }
