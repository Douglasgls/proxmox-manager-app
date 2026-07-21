import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const PopoverContext = React.createContext<PopoverContextType | undefined>(undefined)

export const usePopover = () => {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("usePopover must be used within a Popover")
  }
  return context
}

export interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Popover: React.FC<PopoverProps> = ({
  children,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      const nextValue = typeof value === "function" ? value(open) : value
      if (!isControlled) {
        setUncontrolledOpen(nextValue)
      }
      onOpenChange?.(nextValue)
    },
    [isControlled, open, onOpenChange]
  )

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </PopoverContext.Provider>
  )
}

export const PopoverTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ children, className, onClick, ...props }, ref) => {
  const { open, setOpen } = usePopover()

  return (
    <div
      ref={ref}
      className={cn("cursor-pointer inline-flex items-center", className)}
      onClick={(e) => {
        onClick?.(e)
        setOpen(!open)
      }}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end"
    sideOffset?: number
  }
>(({ children, className, align = "end", sideOffset = 8, ...props }, ref) => {
  const { open, setOpen } = usePopover()
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.parentElement?.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }

  return (
    <div
      ref={contentRef}
      style={{ marginTop: sideOffset }}
      className={cn(
        "absolute z-50 min-w-[18rem] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg outline-none animate-in fade-in-0 zoom-in-95",
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverContent.displayName = "PopoverContent"
