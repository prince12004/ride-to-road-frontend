import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Car", "Schedule & Details", "Payment", "Confirmation"] as const;

export function BookingProgress({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full font-display text-xs font-extrabold transition-colors",
                  done && "bg-lime text-navy-900",
                  active && "bg-navy-900 text-white",
                  !done && !active && "bg-navy-100 text-navy-400",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-semibold sm:block",
                  active ? "text-navy-900" : done ? "text-navy-600" : "text-navy-400",
                )}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className={cn("h-px flex-1", done ? "bg-lime" : "bg-navy-100")} />}
          </li>
        );
      })}
    </ol>
  );
}
