import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", {
  variants: {
    variant: {
      navy: "bg-navy-900 text-white",
      lime: "bg-lime/20 text-brand-deep",
      outline: "border border-navy-200 text-navy-700",
      warning: "bg-amber-100 text-amber-800",
      success: "bg-emerald-100 text-emerald-800",
      destructive: "bg-red-100 text-red-700",
    },
  },
  defaultVariants: { variant: "navy" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
