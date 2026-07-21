import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = "bottom",
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(false)

  const sideClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 pointer-events-none rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md border border-border animate-in fade-in-0 zoom-in-95 whitespace-nowrap",
            sideClasses[side],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
