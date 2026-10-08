import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-24 w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm font-medium text-navy-900 placeholder:text-navy-400 outline-none transition-colors focus-visible:border-navy-900 focus-visible:ring-2 focus-visible:ring-lime disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
