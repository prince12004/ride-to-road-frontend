"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { PageIndexing } from "@/types";

/** Live length hint against the length search engines usually display. */
export function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.trim().length;
  return (
    <span className={cn("text-xs font-medium", len === 0 ? "text-navy-400" : len > max ? "text-red-600" : "text-brand-deep")}>
      {len}/{max}
    </span>
  );
}

export function LabelWithCounter({ label, value, max }: { label: string; value: string; max: number }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <CharCounter value={value} max={max} />
    </div>
  );
}

/** Lowercase, hyphenated, a–z / 0–9 only — mirrors the backend's slugify. */
export function toSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SlugInput({
  prefix,
  value,
  onChange,
  originalSlug,
}: {
  prefix: string;
  value: string;
  onChange: (v: string) => void;
  /** Slug currently live; editing it shows the auto-redirect note. */
  originalSlug?: string;
}) {
  const changed = Boolean(originalSlug) && toSlug(value) !== originalSlug;
  return (
    <div>
      <Label>URL Slug</Label>
      <div className="mt-1.5 flex items-center rounded-2xl border border-navy-200 bg-white pl-4 focus-within:ring-2 focus-within:ring-lime">
        <span className="shrink-0 text-sm text-navy-400">{prefix}</span>
        <input
          className="h-12 min-w-0 flex-1 rounded-r-2xl bg-transparent pr-4 text-sm text-navy-900 outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onChange(toSlug(value))}
          placeholder="auto-generated-from-title"
        />
      </div>
      <p className={cn("mt-1.5 text-xs", changed ? "font-medium text-amber-700" : "text-navy-400")}>
        {changed
          ? `The old URL ${prefix}${originalSlug} will permanently (301) redirect to the new one.`
          : "Lowercase words separated by hyphens. Leave empty to generate from the title."}
      </p>
    </div>
  );
}

/** Canonical URL + robots + sitemap controls shared by every SEO-managed page. */
export function IndexingControls({
  value,
  onChange,
  idPrefix,
}: {
  value: PageIndexing;
  onChange: (patch: Partial<PageIndexing>) => void;
  idPrefix: string;
}) {
  const toggles: { key: "noindex" | "nofollow" | "includeInSitemap"; label: string; hint: string }[] = [
    { key: "noindex", label: "noindex", hint: "Ask search engines not to show this page in results." },
    { key: "nofollow", label: "nofollow", hint: "Ask search engines not to follow links on this page." },
    { key: "includeInSitemap", label: "Include in sitemap.xml", hint: "Pages marked noindex are always left out." },
  ];
  return (
    <div className="space-y-4">
      <div>
        <Label>Canonical URL (optional)</Label>
        <Input
          className="mt-1.5"
          value={value.canonicalUrl ?? ""}
          onChange={(e) => onChange({ canonicalUrl: e.target.value })}
          placeholder="Leave empty to use this page's own URL"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {toggles.map((t) => {
          const checked = t.key === "includeInSitemap" ? value.includeInSitemap !== false : Boolean(value[t.key]);
          return (
            <label key={t.key} htmlFor={`${idPrefix}-${t.key}`} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-navy-100 p-3">
              <Checkbox id={`${idPrefix}-${t.key}`} checked={checked} onCheckedChange={(v) => onChange({ [t.key]: Boolean(v) })} />
              <span>
                <span className="block text-sm font-semibold text-navy-800">{t.label}</span>
                <span className="block text-xs text-navy-500">{t.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** Returns an error message for invalid custom JSON-LD, or null when valid / empty. */
export function customSchemaError(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/^<script/i.test(raw)) return "Paste only the JSON — without the <script> tags.";
  try {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    if (!items.length || !items.every((i) => i && typeof i === "object" && !Array.isArray(i))) {
      return "Must be a JSON object, or an array of objects.";
    }
    return null;
  } catch (e) {
    return `Invalid JSON: ${(e as Error).message}`;
  }
}

/**
 * Extra JSON-LD for one page, added next to the automatic schema
 * (business, breadcrumbs, article / car / FAQ).
 */
export function CustomSchemaField({ value, onChange, autoNote }: { value: string; onChange: (v: string) => void; autoNote?: string }) {
  const error = customSchemaError(value);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Label>Custom schema (JSON-LD, optional)</Label>
        <a
          href="https://search.google.com/test/rich-results"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-brand-deep hover:underline"
        >
          Test in Google ↗
        </a>
      </div>
      <textarea
        className={cn(
          "mt-1.5 block min-h-[140px] w-full rounded-2xl border px-4 py-3 font-mono text-xs leading-relaxed text-navy-800 outline-none focus:ring-2 focus:ring-lime",
          error ? "border-red-300" : "border-navy-200",
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Event",\n  "name": "…"\n}'}
        aria-label="Custom schema JSON-LD"
      />
      <p className={cn("mt-1.5 text-xs", error ? "font-medium text-red-600" : "text-navy-400")}>
        {error ?? autoNote ?? "Added automatically: business details and breadcrumbs. Use this only for extra schema types."}
      </p>
    </div>
  );
}
