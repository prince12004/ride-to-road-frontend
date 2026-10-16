import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCarBySlug, getLocations } from "@/lib/content";
import { BookingForm } from "@/components/booking/booking-form";
import { BookingProgress } from "@/components/booking/booking-progress";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Complete Your Booking",
};

interface BookCarPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string; pickupDate?: string; pickupTime?: string; returnDate?: string; returnTime?: string }>;
}

export default async function BookCarPage({ params, searchParams }: BookCarPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const [car, locations] = await Promise.all([getCarBySlug(slug), getLocations()]);
  if (!car) notFound();

  const matchedLocationId = search.city
    ? locations.find((l) => l.city.toLowerCase() === search.city!.toLowerCase())?.id
    : undefined;

  return (
    <section className="bg-navy-50 pb-10 pt-4 sm:pt-8 lg:py-12">
      <div className="container max-w-9xl">
        <div className="mb-4 rounded-2xl border border-navy-100 bg-white px-3 py-2.5 sm:mb-8 sm:p-5">
          <BookingProgress current={1} />
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep sm:text-xs">Complete your booking</p>
            <h1 className="mt-1.5 truncate font-display text-2xl font-extrabold tracking-tight text-navy-950 sm:mt-3 sm:text-4xl">
              {car.name}
            </h1>
          </div>
          <p className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-navy-900 ring-1 ring-navy-100">
            {formatINR(car.pricePerHour ?? car.pricePerDay)}
            <span className="font-medium text-navy-400">/{car.pricePerHour ? "hr" : "day"}</span>
          </p>
        </div>
        <p className="mt-2 hidden text-navy-500 sm:block">Pick your schedule, add your details and choose how you'd like to pay.</p>

        <div className="mt-4 sm:mt-8">
          <Suspense
            fallback={
              <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
                <div className="h-96 animate-pulse rounded-3xl bg-navy-100" />
                <div className="h-72 animate-pulse rounded-3xl bg-navy-100" />
              </div>
            }
          >
            <BookingForm
              car={car}
              locations={locations}
              initial={{
                locationId: matchedLocationId,
                pickupDate: search.pickupDate,
                pickupTime: search.pickupTime,
                dropDate: search.returnDate,
                dropTime: search.returnTime,
              }}
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
