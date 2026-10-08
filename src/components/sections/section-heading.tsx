import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        <p
          className={cn(
            "inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]",
            dark ? "text-lime" : "text-brand-deep",
          )}
        >
          <span className="h-px w-6 bg-current" />
          {eyebrow}
        </p>
        <h2
          className={cn(
            "mt-4 text-balance font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl",
            dark ? "text-white" : "text-navy-900",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", dark ? "text-navy-300" : "text-navy-500")}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
