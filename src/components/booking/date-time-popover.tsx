"use client";

import { useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeSlotGrid } from "@/components/booking/time-slot-grid";

// The date picker (react-day-picker) is ~25KB gzipped and only needed once a
// date field is opened, so it's split out of the initial page bundle. It's
// preloaded as soon as the user reaches for a date field.
const loadCalendar = () => import("@/components/ui/calendar").then((m) => m.Calendar);
const Calendar = dynamic(loadCalendar, {
  ssr: false,
  loading: () => <div aria-hidden className="h-[328px] w-[288px] animate-pulse rounded-xl bg-navy-50" />,
});
const preloadCalendar = () => void loadCalendar();

export function CalendarPopoverField({
  value,
  onChange,
  fromDate,
  open,
  onOpenChange,
  trigger,
}: {
  value: Date;
  onChange: (d: Date) => void;
  fromDate: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
}) {
  // Fetch the picker once the page is idle, so it opens instantly later
  // without competing with the initial render.
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preloadCalendar, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(preloadCalendar, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        className="w-full text-left outline-none"
        onPointerEnter={preloadCalendar}
        onTouchStart={preloadCalendar}
        onFocus={preloadCalendar}
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          required
          selected={value}
          defaultMonth={value}
          disabled={{ before: fromDate }}
          onSelect={(d) => {
            if (d) onChange(d);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function TimePopoverField({
  value,
  onChange,
  open,
  onOpenChange,
  trigger,
  disabledSlots,
}: {
  value: string;
  onChange: (v: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  disabledSlots?: Set<string>;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger className="w-full text-left outline-none">{trigger}</PopoverTrigger>
      <PopoverContent>
        <TimeSlotGrid value={value} onChange={onChange} disabledSlots={disabledSlots} />
      </PopoverContent>
    </Popover>
  );
}
