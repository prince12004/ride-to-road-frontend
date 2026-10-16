"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Fades content up as it scrolls into view.
 *
 * Content is always visible in the server-rendered HTML — it is never hidden
 * while waiting for JavaScript (that caused a 1–2s blank flash on load).
 * After hydration, only elements that start *below* the viewport are armed
 * for the entrance animation; anything already on screen stays put.
 * Respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already visible (or above the fold): never animate, never hide.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.style.setProperty("--reveal-delay", `${delay}s`);
    el.classList.add("reveal-armed");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("reveal-in");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
