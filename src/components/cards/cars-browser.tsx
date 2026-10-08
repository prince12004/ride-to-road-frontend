"use client";

import { useMemo, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { CarCard } from "@/components/cards/car-card";
import { BookingWidget, type BookingWidgetInitial } from "@/components/sections/booking-widget";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { carCategories } from "@/data/cars";
import { cn } from "@/lib/utils";
import type { Car } from "@/types";

type Category = (typeof carCategories)[number]["value"];
type Sort = "recommended" | "price-asc" | "price-desc";

function formatSearchSummary(initial: BookingWidgetInitial) {
  if (!initial.city) return null;
  const parts = [initial.city];
  if (initial.pickupDate) {
    const pickup = new Date(`${initial.pickupDate}T${initial.pickupTime || "00:00"}`);
    parts.push(pickup.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
  }
  return parts.join(" · ");
}

/** Carries the user's chosen city/dates forward into the car detail & booking pages, so they never have to re-pick them. */
function buildSearchQuery(initial?: BookingWidgetInitial) {
  if (!initial) return "";
  const params = new URLSearchParams();
  if (initial.city) params.set("city", initial.city);
  if (initial.pickupDate) params.set("pickupDate", initial.pickupDate);
  if (initial.pickupTime) params.set("pickupTime", initial.pickupTime);
  if (initial.returnDate) params.set("returnDate", initial.returnDate);
  if (initial.returnTime) params.set("returnTime", initial.returnTime);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function CarsBrowser({
  cars,
  locations = [],
  initialSearch,
}: {
  cars: Car[];
  locations?: string[];
  initialSearch?: BookingWidgetInitial;
}) {
  const [category, setCategory] = useState<Category>("all");
  const [transmission, setTransmission] = useState<"any" | Car["transmission"]>("any");
  const [sort, setSort] = useState<Sort>("recommended");
  const [editingSearch, setEditingSearch] = useState(false);

  const visible = useMemo(() => {
    const list = cars.filter(
      (c) =>
        (category === "all" || c.category === category) &&
        (transmission === "any" || c.transmission === transmission),
    );
    if (sort === "price-asc") return [...list].sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sort === "price-desc") return [...list].sort((a, b) => b.pricePerDay - a.pricePerDay);
    // Recommended: available cars first, then by original order.
    return [...list].sort((a, b) => Number(b.available !== false) - Number(a.available !== false));
  }, [cars, category, transmission, sort]);

  const summary = initialSearch ? formatSearchSummary(initialSearch) : null;
  const searchQuery = buildSearchQuery(initialSearch);

  return (
    <>
      {locations.length > 0 && (
        <div className="mb-8">
          {summary && !editingSearch ? (
            <button
              type="button"
              onClick={() => setEditingSearch(true)}
              className="flex w-full flex-wrap items-center gap-3 rounded-2xl border border-navy-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:border-navy-900"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy-50 text-brand-deep">
                <MapPin className="size-4" />
              </span>
              <span className="text-sm font-semibold text-navy-900">{summary}</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-brand-deep">
                <CalendarDays className="size-3.5" /> Edit search
              </span>
            </button>
          ) : (
            <BookingWidget cities={locations} initial={initialSearch} />
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 border-b border-navy-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Car type" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          {carCategories.map((c) => (
            <button
              key={c.value}
              type="button"
              role="tab"
              aria-selected={category === c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                "h-10 shrink-0 rounded-full border px-5 text-sm font-semibold transition-colors",
                category === c.value
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-navy-200 text-navy-600 hover:border-navy-900 hover:text-navy-900",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="h-10 rounded-full border border-navy-200 px-4 sm:w-44">
            <Select value={transmission} onValueChange={(v) => setTransmission(v as typeof transmission)}>
              <SelectTrigger aria-label="Transmission" className="h-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any gearbox</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Automatic">Automatic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-10 rounded-full border border-navy-200 px-4 sm:w-48">
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger aria-label="Sort by" className="h-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-navy-500" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? "car" : "cars"}
      </p>

      {visible.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((car) => (
            <CarCard key={car.id} car={car} searchQuery={searchQuery} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-navy-200 p-12 text-center">
          <p className="font-display text-lg font-bold text-navy-900">No cars match these filters.</p>
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              setTransmission("any");
            }}
            className="mt-3 text-sm font-semibold text-brand-deep underline underline-offset-4"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
