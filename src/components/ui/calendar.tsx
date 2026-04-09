import * as React from "react"
import { ChevronLeft, ChevronRight, Heart } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  className?: string
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  month?: Date
  onMonthChange?: (date: Date) => void
  disabled?: (date: Date) => boolean
}

function Calendar({
  className,
  selected,
  onSelect,
  month: controlledMonth,
  onMonthChange,
  disabled,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(controlledMonth || new Date())
  const currentMonth = controlledMonth || internalMonth

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"]

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => handleMonthChange(subMonths(currentMonth, 1))}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[hsl(var(--accent))] opacity-50 hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {format(currentMonth, "yyyy년 M월", { locale: ko })}
        </span>
        <button
          type="button"
          onClick={() => handleMonthChange(addMonths(currentMonth, 1))}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[hsl(var(--accent))] opacity-50 hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {weekDays.map((d) => (
          <div key={d} className="h-8 flex items-center justify-center text-[0.8rem] font-normal text-[hsl(var(--muted-foreground))]">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const isSelected = selected && isSameDay(day, selected)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)
          const isDisabled = disabled?.(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) onSelect?.(day)
              }}
              className={cn(
                "relative h-9 w-9 flex items-center justify-center text-sm rounded-md transition-colors",
                !isCurrentMonth && "opacity-30 text-[hsl(var(--muted-foreground))]",
                isCurrentMonth && "hover:bg-[hsl(var(--accent))]",
                isSelected && "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]",
                today && !isSelected && "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {today && (
                <Heart
                  className="absolute w-7 h-7"
                  style={{ color: 'hsl(340, 70%, 85%)', fill: 'hsl(340, 70%, 85%)', opacity: 0.6, strokeWidth: 0 }}
                />
              )}
              <span className="relative z-10">{format(day, "d")}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
