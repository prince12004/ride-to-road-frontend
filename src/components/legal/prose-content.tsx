import { cn } from "@/lib/utils";

/**
 * Renders admin-authored HTML (site-content / blog bodies) with hand-styled
 * child selectors, matching the rest of the design system without pulling in
 * a typography plugin. The HTML is trusted, admin-authored content — not
 * user-submitted — so `dangerouslySetInnerHTML` is an accepted, scoped risk.
 */
export function ProseContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        "[&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-navy-900 [&_h2]:mt-8",
        "[&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-navy-900 [&_h3]:mt-6",
        "[&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-navy-600",
        "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-navy-600",
        "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ol]:text-navy-600",
        "[&_a]:text-brand-deep [&_a]:underline [&_strong]:font-semibold [&_strong]:text-navy-900",
        "[&_img]:mt-6 [&_img]:rounded-2xl",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
