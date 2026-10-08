"use client";

import type { ReactNode } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeSlotGrid } from "@/components/booking/time-slot-grid";

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
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger className="w-full text-left outline-none">{trigger}</PopoverTrigger>
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
