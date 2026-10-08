"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_24px_48px_-24px_rgba(14,29,38,0.35)]",
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
            <button onClick={() => dismiss(t.id)} className="text-navy-400 hover:text-navy-700">
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
