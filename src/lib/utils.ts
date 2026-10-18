import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Today's date in India (start of day, as a local Date). Server (UTC) and
 * browser (IST) must agree on default booking dates, or the server HTML and
 * the first client render differ — a hydration mismatch that flickers.
 */
export function todayInIndia(): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return new Date(y, m - 1, d);
}

/** "YYYY-MM-DD" of an instant, in India time (for date inputs sent to the API). */
export function istDateInput(date: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
}

/** "HH:MM" (24h) of an instant, in India time. */
export function istTimeInput(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(date));
}

/** The instant for a date + time picked in India time — mirrors the API's combineDateAndTime. */
export function istInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+05:30`);
}

/** "20 Oct 2026, 07:00 pm" in India time. */
export function formatDateTimeIST(date: Date | string): string {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
