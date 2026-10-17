/**
 * Content access layer — every public section reads live data from the
 * Ride to Road API (Express + MongoDB) through these functions.
 *
 * Caching: each fetch is tagged, and the backend calls /revalidate with the
 * matching tag whenever an admin creates, edits or deletes that content, so
 * changes show up immediately. The `revalidate` seconds are only a fallback.
 *
 * Errors are NOT swallowed: a failed API call throws, so a statically cached
 * page keeps serving its last good version (Next.js won't replace it with an
 * error), and dynamic pages show the error boundary instead of a misleading
 * "nothing here yet" state. An empty list means the database really is empty.
 */
import { serverFetch, ApiClientError } from "@/lib/api";
import type { Car, CarDetail, Location, Journey, Offer, Testimonial, BlogPost, Faq } from "@/types";

/** Cache tags — keep in sync with backend/src/services/revalidate.service.ts. */
export const TAGS = {
  cars: "cars",
  locations: "locations",
  journeys: "journeys",
  offers: "offers",
  testimonials: "testimonials",
  blogs: "blogs",
  faqs: "faqs",
  siteContent: "site-content",
  settings: "settings",
} as const;

const FALLBACK_SECONDS = 60;

async function data<T>(path: string, tags: string[], revalidate = FALLBACK_SECONDS): Promise<T> {
  return (await serverFetch<T>(path, { tags, revalidate })).data;
}

/** For single records: a 404 means "not found", anything else is a real error. */
async function dataOrNull<T>(path: string, tags: string[], revalidate = FALLBACK_SECONDS): Promise<T | null> {
  try {
    return await data<T>(path, tags, revalidate);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) return null;
    throw err;
  }
}

export interface CarSearchFilters {
  city?: string;
  pickupDate?: string;
  pickupTime?: string;
  dropDate?: string;
  dropTime?: string;
}

export async function getCars(filters: CarSearchFilters = {}) {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.city) params.set("city", filters.city);
  if (filters.pickupDate) params.set("pickupDate", filters.pickupDate);
  if (filters.pickupTime) params.set("pickupTime", filters.pickupTime);
  if (filters.dropDate) params.set("dropDate", filters.dropDate);
  if (filters.dropTime) params.set("dropTime", filters.dropTime);
  // Date searches depend on live bookings, so they're never cached.
  return data<Car[]>(`/cars?${params.toString()}`, [TAGS.cars], filters.city || filters.pickupDate ? 0 : FALLBACK_SECONDS);
}

export async function getFeaturedCars(limit = 4) {
  return data<Car[]>(`/cars?featured=true&limit=${limit}`, [TAGS.cars]);
}

/** Homepage fleet: admin-featured cars first, then newest (sorted by the API). */
export async function getHomeCars(limit = 12) {
  return data<Car[]>(`/cars?limit=${limit}`, [TAGS.cars]);
}

export async function getCarBySlug(slug: string): Promise<CarDetail | null> {
  return dataOrNull<CarDetail>(`/cars/${slug}`, [TAGS.cars, TAGS.locations]);
}

export async function getLocations() {
  return data<Location[]>("/locations", [TAGS.locations]);
}

export async function getJourneys() {
  return data<Journey[]>("/journeys", [TAGS.journeys]);
}

export async function getFeaturedOffer() {
  return data<Offer | null>("/offers/featured", [TAGS.offers]);
}

export async function getTestimonials() {
  return data<Testimonial[]>("/testimonials", [TAGS.testimonials]);
}

export async function getBlogPosts(limit = 3) {
  return data<BlogPost[]>(`/blogs?limit=${limit}`, [TAGS.blogs]);
}

export async function getBlogBySlug(slug: string) {
  return dataOrNull<Record<string, unknown>>(`/blogs/${slug}`, [TAGS.blogs]);
}

export async function getFaqs() {
  return data<Faq[]>("/faqs", [TAGS.faqs]);
}

export async function getSiteContent(key: string) {
  return dataOrNull<{ title: string; content: string }>(`/site-content/${key}`, [TAGS.siteContent]);
}
