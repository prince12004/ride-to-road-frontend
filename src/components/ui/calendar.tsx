"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn("p-1", className)}
      classNames={{
        months: "relative flex flex-col",
        month: "space-y-3",
        month_caption: "flex h-9 items-center justify-center font-display text-sm font-bold",
        nav: "absolute inset-x-0 top-0 flex h-9 items-center justify-between",
        button_previous:
          "grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50 disabled:opacity-30",
        button_next: "grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50 disabled:opacity-30",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-10 text-center text-[11px] font-semibold uppercase tracking-wide text-navy-400",
        week: "mt-1 flex",
        day: "size-10 p-0 text-center text-sm",
        day_button:
          "size-10 rounded-full font-medium transition-colors hover:bg-navy-50 aria-selected:bg-navy-900 aria-selected:text-white",
        selected: "",
        today: "font-bold text-brand-deep",
        outside: "text-navy-300",
        disabled: "pointer-events-none text-navy-200 line-through",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />,
      }}
      {...props}
    />
  );
}
