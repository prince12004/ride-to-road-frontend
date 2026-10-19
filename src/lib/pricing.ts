/**
 * Client-side mirror of backend/src/services/priceCalculator.service.ts, used
 * for the live estimate on the booking form. The API recalculates the real
 * amount, so keep the two in sync.
 */
export const MIN_RENTAL_HOURS = 24;

export interface RateCard {
  pricePerDay: number;
  pricePerHour?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
}

export function effectiveDailyRate(rates: Pick<RateCard, "pricePerDay" | "pricePerHour">): number {
  return rates.pricePerHour ? Math.round(rates.pricePerHour * 24) : rates.pricePerDay;
}

export function calculateBaseAmount(car: RateCard, durationHours: number): number {
  const daily = effectiveDailyRate(car);
  let hours = Math.max(0, Math.ceil(durationHours));
  let total = 0;
  if (car.monthlyPrice && hours >= 30 * 24) {
    total += Math.floor(hours / (30 * 24)) * car.monthlyPrice;
    hours %= 30 * 24;
  }
  if (car.weeklyPrice && hours >= 7 * 24) {
    total += Math.floor(hours / (7 * 24)) * car.weeklyPrice;
    hours %= 7 * 24;
  }
  total += Math.floor(hours / 24) * daily;
  const leftover = hours % 24;
  if (leftover > 0) total += car.pricePerHour ? Math.min(leftover * car.pricePerHour, daily) : daily;
  return Math.round(total);
}

export const DEFAULT_KM_PER_DAY = 300;
export const DEFAULT_EXTRA_KM_RATE = 7;

/** "1 Day 13 Hours", "2 Days", "5 Hours" — the duration wording used everywhere. */
export function formatDuration(totalHours: number): string {
  const hours = Math.max(0, Math.ceil(totalHours));
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  const parts = [d > 0 && `${d} Day${d !== 1 ? "s" : ""}`, h > 0 && `${h} Hour${h !== 1 ? "s" : ""}`].filter(Boolean);
  return parts.length ? parts.join(" ") : "0 Hours";
}

/** Free km for a rental: kmPerDay for every completed 24 hours (at least one day). Mirrors the API. */
export function includedKm(durationHours: number, kmPerDay: number): number {
  return Math.max(1, Math.floor(durationHours / 24)) * kmPerDay;
}
