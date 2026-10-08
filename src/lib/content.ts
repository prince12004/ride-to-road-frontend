/**
 * Content access layer.
 *
 * Every section reads data through these functions. They call the Ride to
 * Road API (Express + MongoDB) — components never needed to change when we
 * swapped the bodies from static demo data to real fetch() calls.
 */
import { serverFetch, ApiClientError } from "@/lib/api";
import type { Car, CarDetail, Location, Journey, Offer, Testimonial, BlogPost, Faq } from "@/types";

async function safe<T>(promise: Promise<{ data: T }>, fallback: T): Promise<T> {
  try {
    return (await promise).data;
  } catch {
    return fallback;
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
  return safe(serverFetch<Car[]>(`/cars?${params.toString()}`, { revalidate: filters.city ? 0 : 30 }), []);
}

export async function getFeaturedCars(limit = 4) {
  return safe(serverFetch<Car[]>(`/cars?featured=true&limit=${limit}`, { revalidate: 30 }), []);
}

export async function getHomeCars(limit = 8) {
  return safe(serverFetch<Car[]>(`/cars?limit=${limit}`, { revalidate: 30 }), []);
}

export async function getCarBySlug(slug: string): Promise<CarDetail | null> {
  try {
    const res = await serverFetch<CarDetail>(`/cars/${slug}`, { revalidate: 15 });
    return res.data;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) return null;
    throw err;
  }
}

export async function getLocations() {
  return safe(serverFetch<Location[]>("/locations", { revalidate: 120 }), []);
}

export async function getJourneys() {
  return safe(serverFetch<Journey[]>("/journeys", { revalidate: 120 }), []);
}

export async function getFeaturedOffer() {
  return safe(serverFetch<Offer | null>("/offers/featured", { revalidate: 60 }), null);
}

export async function getTestimonials() {
  return safe(serverFetch<Testimonial[]>("/testimonials", { revalidate: 120 }), []);
}

export async function getBlogPosts(limit = 3) {
  return safe(serverFetch<BlogPost[]>(`/blogs?limit=${limit}`, { revalidate: 60 }), []);
}

export async function getBlogBySlug(slug: string) {
  try {
    const res = await serverFetch<Record<string, unknown>>(`/blogs/${slug}`, { revalidate: 60 });
    return res.data;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) return null;
    throw err;
  }
}

export async function getFaqs() {
  return safe(serverFetch<Faq[]>("/faqs", { revalidate: 120 }), []);
}

export async function getSiteContent(key: string) {
  try {
    const res = await serverFetch<{ title: string; content: string }>(`/site-content/${key}`, { revalidate: 60 });
    return res.data;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) return null;
    throw err;
  }
}
