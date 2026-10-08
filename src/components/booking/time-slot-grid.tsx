"use client";

import { Clock3 } from "lucide-react";
import { TIME_SLOTS } from "@/lib/time-slots";
import { cn } from "@/lib/utils";

export function TimeSlotGrid({
  value,
  onChange,
  disabledSlots,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabledSlots?: Set<string>;
  className?: string;
}) {
  return (
    <div className={cn("w-[290px]", className)}>
      <p className="mb-2.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
        <Clock3 className="size-3.5" /> Select a time
      </p>
      <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1">
        {TIME_SLOTS.map((slot) => {
          const selected = slot.value === value;
          const disabled = disabledSlots?.has(slot.value);
          return (
            <button
              key={slot.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(slot.value)}
              className={cn(
                "rounded-xl border px-2 py-2 text-xs font-semibold transition-all",
                selected
                  ? "border-brand-deep bg-navy-900 text-white shadow-[0_8px_20px_-8px_rgba(14,29,38,0.5)]"
                  : disabled
                    ? "cursor-not-allowed border-navy-100 text-navy-300 line-through"
                    : "border-navy-100 text-navy-700 hover:border-navy-900 hover:bg-navy-50",
              )}
            >
              {slot.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
