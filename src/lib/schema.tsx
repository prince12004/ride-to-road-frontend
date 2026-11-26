/**
 * schema.org structured data (JSON-LD). Builders return plain objects; the
 * <JsonLd> component renders them. Admin-entered custom schema is rendered
 * through the same component.
 */
import { serverFetch } from "@/lib/api";
import { TAGS } from "@/lib/content";
import { siteConfig } from "@/config/site";
import type { ImageRef } from "@/types";

type Json = Record<string, unknown>;

/** Absolute URL on the site. */
export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteConfig.url}${path === "/" ? "" : path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Serialises JSON-LD safely for a <script> tag: "<" is escaped so content
 * like "</script>" inside a string can't end the tag early.
 */
function serialize(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: { data: Json | Json[] | null | undefined }) {
  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />;
}

/** Admin "Custom schema" box. Invalid JSON is skipped rather than breaking the page. */
export function CustomJsonLd({ value }: { value?: string | null }) {
  if (!value?.trim()) return null;
  try {
    return <JsonLd data={JSON.parse(value) as Json | Json[]} />;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Site-wide business + website schema
// ---------------------------------------------------------------------------

interface PublicSettings {
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: ImageRef;
  socialLinks?: Record<string, string | undefined>;
  seo?: {
    defaultDescription?: string;
    defaultOgImage?: ImageRef;
    businessType?: string;
    priceRange?: string;
    openingHours?: string;
    areaServed?: string[];
    latitude?: number;
    longitude?: number;
  };
}

export async function getSchemaSettings(): Promise<PublicSettings> {
  try {
    return (await serverFetch<PublicSettings>("/settings", { revalidate: 60, tags: [TAGS.settings] })).data ?? {};
  } catch {
    return {};
  }
}

const BUSINESS_ID = `${siteConfig.url}/#business`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

export function businessSchema(s: PublicSettings): Json {
  const seo = s.seo ?? {};
  const sameAs = Object.values(s.socialLinks ?? {}).filter((u): u is string => Boolean(u && /^https?:\/\//.test(u)));
  const phone = s.phone || siteConfig.contact.phone;
  const email = s.email || siteConfig.contact.email;
  return {
    "@context": "https://schema.org",
    "@type": seo.businessType || "AutoRental",
    "@id": BUSINESS_ID,
    name: s.companyName || siteConfig.name,
    url: siteConfig.url,
    description: seo.defaultDescription || siteConfig.description,
    logo: absoluteUrl(s.logo?.url || "/brand/logo-compact.png"),
    image: absoluteUrl(seo.defaultOgImage?.url || "/images/hero-suv.jpg"),
    telephone: phone,
    email,
    ...(s.address ? { address: { "@type": "PostalAddress", streetAddress: s.address, addressCountry: "IN" } } : {}),
    ...(seo.latitude !== undefined && seo.longitude !== undefined
      ? { geo: { "@type": "GeoCoordinates", latitude: seo.latitude, longitude: seo.longitude } }
      : {}),
    ...(seo.areaServed?.length ? { areaServed: seo.areaServed.map((name) => ({ "@type": "City", name })) } : {}),
    ...(seo.priceRange ? { priceRange: seo.priceRange } : {}),
    ...(seo.openingHours ? { openingHours: seo.openingHours } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteSchema(s: PublicSettings): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: s.companyName || siteConfig.name,
    url: siteConfig.url,
    inLanguage: "en-IN",
    publisher: { "@id": BUSINESS_ID },
  };
}

// ---------------------------------------------------------------------------
// Page-level schema
// ---------------------------------------------------------------------------

export function breadcrumbSchema(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}

export function faqPageSchema(faqs: { question: string; answer: string }[]): Json | null {
  const valid = faqs.filter((f) => f.question?.trim() && f.answer?.trim());
  if (!valid.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: valid.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}

export function blogPostingSchema(post: {
  slug: string;
  title: string;
  description?: string;
  image?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  category?: string;
  keywords?: string[];
}): Json {
  const url = absoluteUrl(`/blogs/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    headline: post.title.slice(0, 110),
    ...(post.description ? { description: post.description } : {}),
    ...(post.image ? { image: [absoluteUrl(post.image)] } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt || post.publishedAt ? { dateModified: post.updatedAt || post.publishedAt } : {}),
    author: post.author ? { "@type": "Person", name: post.author } : { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    publisher: { "@id": BUSINESS_ID },
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.keywords?.length ? { keywords: post.keywords.join(", ") } : {}),
    inLanguage: "en-IN",
  };
}

export function carSchema(car: {
  slug: string;
  name: string;
  brand: string;
  description?: string;
  images: string[];
  pricePerDay: number;
  available: boolean;
  seats?: number;
  transmission?: string;
  fuel?: string;
  category?: string;
}): Json {
  const url = absoluteUrl(`/cars/${car.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": ["Product", "Car"],
    "@id": `${url}#car`,
    name: `${car.name} Self Drive Rental`,
    url,
    brand: { "@type": "Brand", name: car.brand },
    ...(car.description ? { description: car.description } : {}),
    image: car.images.filter(Boolean).map(absoluteUrl),
    ...(car.category ? { category: car.category } : {}),
    ...(car.seats ? { seatingCapacity: car.seats } : {}),
    ...(car.transmission ? { vehicleTransmission: car.transmission } : {}),
    ...(car.fuel ? { fuelType: car.fuel } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: car.pricePerDay,
      priceSpecification: { "@type": "UnitPriceSpecification", price: car.pricePerDay, priceCurrency: "INR", unitCode: "DAY", unitText: "per day" },
      availability: car.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": BUSINESS_ID },
    },
  };
}
