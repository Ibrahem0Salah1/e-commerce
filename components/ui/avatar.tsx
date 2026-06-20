"use client"

import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full outline-1 outline-border",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<"img">) {
  return (
    <img
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  delayMs,
  ...props
}: React.ComponentProps<"span"> & { delayMs?: number }) {
  const [hydrated, setHydrated] = React.useState(delayMs ? false : true)

  React.useEffect(() => {
    if (!delayMs) return
    const timer = setTimeout(() => setHydrated(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])

  if (!hydrated) return null

  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
