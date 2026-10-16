"use client";

import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    // Phones: full-width above the sticky bottom action bar. Larger: bottom-right stack.
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[100] flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-full sm:max-w-sm"
    >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_24px_48px_-24px_rgba(14,29,38,0.35)] duration-300 animate-in fade-in-0 slide-in-from-bottom-3",
              t.variant === "success" && "border-lime-400",
              t.variant === "error" && "border-red-300"
            )}
          >
            {t.variant === "success" && <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-lime-600" />}
            {t.variant === "error" && <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />}
            {(!t.variant || t.variant === "default") && <Info className="mt-0.5 size-5 shrink-0 text-navy-600" />}
            <div className="flex-1">
              <p className="text-sm font-semibold text-navy-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-navy-500">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-m-1 p-1 text-navy-400 hover:text-navy-700">
              <X className="size-4" />
            </button>
          </div>
        ))}
    </div>
  );
}
