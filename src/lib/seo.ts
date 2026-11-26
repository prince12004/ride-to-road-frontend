/**
 * SEO layer: turns the admin-managed SEO fields (site defaults, static page
 * overrides, per-blog / per-car fields) into Next.js metadata.
 *
 * Metadata lookups never throw: if the API is unreachable the page still
 * renders with the code-level fallback title and description.
 */
import type { Metadata } from "next";
import { serverFetch } from "@/lib/api";
import { TAGS } from "@/lib/content";
import { siteConfig } from "@/config/site";
import type { ImageRef, PageSeo } from "@/types";

/** Keep in sync with STATIC_SEO_PAGES in backend/src/models/PageSeo.ts. */
export const STATIC_SEO_PATHS = [
  "/",
  "/cars",
  "/blogs",
  "/about-us",
  "/faq",
  "/contact-us",
  "/terms-and-conditions",
  "/cancellation-policy",
  "/refund-policy",
  "/privacy-policy",
] as const;
export type StaticSeoPath = (typeof STATIC_SEO_PATHS)[number];

export const DEFAULT_HOME_TITLE = `${siteConfig.name} | Self-Drive Car Rental in Delhi NCR`;
const DEFAULT_OG_IMAGE = "/images/hero-suv.jpg";

interface SeoDefaults {
  defaultSeoTitle?: string;
  defaultDescription?: string;
  defaultOgImage?: ImageRef | string;
}

export function imageUrl(img?: { url?: string } | string | null): string | undefined {
  if (!img) return undefined;
  return typeof img === "string" ? img || undefined : img.url || undefined;
}

export async function getSeoDefaults(): Promise<SeoDefaults> {
  try {
    const res = await serverFetch<{ seo?: SeoDefaults }>("/settings", { revalidate: 60, tags: [TAGS.settings] });
    return res.data?.seo ?? {};
  } catch {
    return {};
  }
}

/** Saved overrides for every static page (pages never edited are absent). */
export async function getAllPageSeo(): Promise<PageSeo[]> {
  const res = await serverFetch<PageSeo[]>("/seo/pages", { revalidate: 60, tags: [TAGS.seo] });
  return res.data;
}

async function getPageSeo(path: StaticSeoPath): Promise<PageSeo | null> {
  try {
    return (await getAllPageSeo()).find((p) => p.path === path) ?? null;
  } catch {
    return null;
  }
}

export interface SeoInput {
  /** Site path of the page, used as the default canonical URL. */
  path: string;
  /** Fallback title (goes through the "%s | Ride to Road" template). */
  title?: string;
  /** Exact title that bypasses the template, e.g. the home page. */
  absoluteTitle?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  /** Admin-entered overrides — any set field wins over the fallbacks above. */
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: ImageRef | string;
    keywords?: string[];
    canonicalUrl?: string;
    noindex?: boolean;
    nofollow?: boolean;
  } | null;
}

export async function buildMetadata(input: SeoInput): Promise<Metadata> {
  const defaults = await getSeoDefaults();
  const seo = input.seo ?? {};

  const customTitle = seo.metaTitle?.trim();
  const title: Metadata["title"] = customTitle
    ? { absolute: customTitle }
    : input.absoluteTitle
      ? { absolute: input.absoluteTitle }
      : input.title;
  const resolvedTitle = customTitle || input.absoluteTitle || (input.title ? `${input.title} | ${siteConfig.name}` : DEFAULT_HOME_TITLE);

  const description =
    seo.metaDescription?.trim() || input.description || defaults.defaultDescription || siteConfig.description;
  const canonical = seo.canonicalUrl?.trim() || input.path;
  const image = imageUrl(seo.ogImage) || input.image || imageUrl(defaults.defaultOgImage) || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    ...(seo.keywords?.length ? { keywords: seo.keywords } : {}),
    alternates: { canonical },
    robots: { index: !seo.noindex, follow: !seo.nofollow },
    openGraph: {
      title: seo.ogTitle?.trim() || resolvedTitle,
      description: seo.ogDescription?.trim() || description,
      url: canonical,
      siteName: siteConfig.name,
      images: [image],
      locale: "en_IN",
      type: input.type ?? "website",
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    },
  };
}

/** Metadata for a fixed page: admin overrides from SEO → Page Meta, else the given fallbacks. */
export async function staticPageMetadata(
  path: StaticSeoPath,
  fallback: Omit<SeoInput, "path" | "seo">,
): Promise<Metadata> {
  const seo = await getPageSeo(path);
  return buildMetadata({ ...fallback, path, seo });
}
