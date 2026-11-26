import type { MetadataRoute } from "next";
import { serverFetch } from "@/lib/api";
import { TAGS } from "@/lib/content";
import { siteConfig } from "@/config/site";
import { getAllPageSeo, STATIC_SEO_PATHS } from "@/lib/seo";

interface SitemapEntries {
  blogs: { slug: string; updatedAt?: string }[];
  cars: { slug: string; updatedAt?: string }[];
  landingPages?: { slug: string; updatedAt?: string }[];
}

/**
 * sitemap.xml — static pages plus every published blog and listed car,
 * minus anything marked noindex or "exclude from sitemap" in the admin panel.
 * Rebuilt whenever SEO, blog or car data changes (cache tags).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pageSeo, entries] = await Promise.all([
    getAllPageSeo(),
    serverFetch<SitemapEntries>("/seo/sitemap", { revalidate: 300, tags: [TAGS.seo, TAGS.blogs, TAGS.cars, TAGS.landingPages] }).then((r) => r.data),
  ]);
  const overrides = new Map(pageSeo.map((p) => [p.path, p]));
  const url = (path: string) => `${siteConfig.url}${path === "/" ? "" : path}`;

  const staticPages: MetadataRoute.Sitemap = STATIC_SEO_PATHS.filter((path) => {
    const o = overrides.get(path);
    return !o?.noindex && o?.includeInSitemap !== false;
  }).map((path) => ({
    url: url(path),
    lastModified: overrides.get(path)?.updatedAt,
    changeFrequency: path === "/" || path === "/cars" || path === "/blogs" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/cars" ? 0.9 : 0.5,
  }));

  return [
    ...staticPages,
    ...(entries.landingPages ?? []).map((p) => ({ url: url(`/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...entries.cars.map((c) => ({ url: url(`/cars/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...entries.blogs.map((b) => ({ url: url(`/blogs/${b.slug}`), lastModified: b.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
