import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export interface SelectTriggerProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface SelectValueProps
  extends React.HTMLAttributes<HTMLDivElement> {
  placeholder?: string
}

export interface SelectContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface SelectItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const Select = React.forwardRef<
  HTMLDivElement,
  {
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
  }
>(({ value, onValueChange, children }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")
  const [displayValue, setDisplayValue] = React.useState("")
  
  const handleSelect = (newValue: string, displayText: string) => {
    setSelectedValue(newValue)
    setDisplayValue(displayText)
    setIsOpen(false)
    onValueChange?.(newValue)
  }

  return (
    <div className="relative" ref={ref}>
      {React.cloneElement(children as React.ReactElement, {
        isOpen,
        setIsOpen,
        selectedValue,
        displayValue,
        handleSelect
      } as any)}
    </div>
  )
})
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<HTMLDivElement, SelectTriggerProps & {
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
  displayValue?: string
}>(({ className, children, isOpen, setIsOpen, displayValue, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
      onClick={() => setIsOpen?.(!isOpen)}
      {...props}
    >
      <span>{displayValue || "Select..."}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </div>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<HTMLDivElement, SelectValueProps>(
  ({ className, placeholder = "Select...", ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {placeholder}
    </div>
  )
)
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps & {
  isOpen?: boolean
  selectedValue?: string
  handleSelect?: (value: string, displayText: string) => void
}>(({ className, children, isOpen, selectedValue, handleSelect, ...props }, ref) => {
  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full left-0 right-0 z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              selectedValue,
              handleSelect,
            } as any)
          }
          return child
        })}
      </div>
    </div>
  )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps & {
  selectedValue?: string
  handleSelect?: (value: string, displayText: string) => void
}>(({ className, children, value, selectedValue, handleSelect, ...props }, ref) => {
  const isSelected = selectedValue === value
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => handleSelect?.(value, children as string)}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }